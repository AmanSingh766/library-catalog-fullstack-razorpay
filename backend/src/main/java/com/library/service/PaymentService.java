package com.library.service;

import com.library.dto.PaymentDTO;
import com.library.entity.*;
import com.library.repository.*;
//import com.razorpay.*;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Refund;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    // 50 paise per book per day × 14 days = 700 paise = 7 INR per book
    private static final long PRICE_PER_BOOK_PAISE = 700L;

    @Value("${razorpay.api.key}")
    private String razorpayKeyId;

    @Value("${razorpay.api.secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.currency:INR}")
    private String currency;

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          OrderRepository orderRepository,
                          BookRepository bookRepository,
                          UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    /**
     * Step 1: Create Razorpay order for a library order
     */
    @Transactional
    public PaymentDTO.CreateOrderResponse createRazorpayOrder(Long libraryOrderId, Long userId) {
        Order order = orderRepository.findById(libraryOrderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Check if payment already exists for this order
        paymentRepository.findByOrderId(libraryOrderId).ifPresent(p -> {
            if (p.getStatus() == Payment.PaymentStatus.PAID) {
                throw new RuntimeException("Order already paid");
            }
        });

        // Calculate amount: number of books × price per book
        long totalBooks = order.getOrderItems() != null
                ? order.getOrderItems().stream().mapToLong(item -> item.getQuantity()).sum()
                : order.getTotalItems();
        long amountPaise = totalBooks * PRICE_PER_BOOK_PAISE;
        if (amountPaise < 100) amountPaise = 100; // Razorpay min 1 INR

        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountPaise);
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", "library_order_" + libraryOrderId);
            orderRequest.put("notes", new JSONObject()
                    .put("library_order_id", libraryOrderId)
                    .put("user_id", userId)
                    .put("user_email", user.getEmail()));

            com.razorpay.Order rzpOrder = client.orders.create(orderRequest);
            String rzpOrderId = rzpOrder.get("id");

            // Save payment record
            Payment payment = new Payment();
            payment.setRazorpayOrderId(rzpOrderId);
            payment.setOrder(order);
            payment.setUser(user);
            payment.setAmountPaise(amountPaise);
            payment.setCurrency(currency);
            payment.setStatus(Payment.PaymentStatus.CREATED);
            paymentRepository.save(payment);

            // Build response
            PaymentDTO.CreateOrderResponse response = new PaymentDTO.CreateOrderResponse();
            response.setRazorpayOrderId(rzpOrderId);
            response.setAmountPaise(amountPaise);
            response.setCurrency(currency);
            response.setKeyId(razorpayKeyId);
            response.setLibraryOrderId(libraryOrderId);
            response.setUserEmail(user.getEmail());
            response.setUserName(user.getFullName() != null ? user.getFullName() : user.getUsername());

            return response;

        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            throw new RuntimeException("Payment gateway error: " + e.getMessage());
        }
    }

    /**
     * Step 2: Verify payment signature, check inventory, complete or refund
     */
    @Transactional
    public PaymentDTO.PaymentResponse verifyAndProcessPayment(PaymentDTO.VerifyRequest req) {
        Payment payment = paymentRepository.findByRazorpayOrderId(req.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Payment record not found"));

        // Step 2a: Verify Razorpay signature
        boolean isValid = verifySignature(
                req.getRazorpayOrderId(),
                req.getRazorpayPaymentId(),
                req.getRazorpaySignature()
        );

        if (!isValid) {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason("Signature verification failed");
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            // Rollback order items inventory (they were reserved)
            rollbackOrderInventory(payment.getOrder());
            throw new RuntimeException("Payment verification failed - possible tampering detected");
        }

        // Signature valid — mark payment details
        payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
        payment.setRazorpaySignature(req.getRazorpaySignature());

        // Step 2b: Check inventory for all ordered books
        Order order = payment.getOrder();
        boolean stockAvailable = checkInventoryAvailability(order);

        if (!stockAvailable) {
            // Books not available — initiate refund
            log.warn("Stock not available for order {}. Initiating refund.", order.getId());
            payment.setStatus(Payment.PaymentStatus.INVENTORY_FAIL);
            payment.setFailureReason("Books out of stock. Refund initiated.");
            payment.setUpdatedAt(LocalDateTime.now());

            // Refund via Razorpay
            String refundId = initiateRefund(req.getRazorpayPaymentId(), payment.getAmountPaise());
            payment.setRefundId(refundId);
            payment.setStatus(Payment.PaymentStatus.REFUNDED);

            // Cancel the order
            order.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);
            paymentRepository.save(payment);

            return PaymentDTO.PaymentResponse.fromEntity(payment);
        }

        // Step 2c: Stock available — reduce inventory & complete order
        reduceInventory(order);

        payment.setStatus(Payment.PaymentStatus.PAID);
        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        order.setStatus(Order.OrderStatus.COMPLETED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        log.info("Payment successful and order {} completed", order.getId());
        return PaymentDTO.PaymentResponse.fromEntity(payment);
    }

    /**
     * Step 3: Handle payment failure from frontend
     */
    @Transactional
    public PaymentDTO.PaymentResponse handlePaymentFailure(String razorpayOrderId, String reason) {
        Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setStatus(Payment.PaymentStatus.FAILED);
        payment.setFailureReason(reason != null ? reason : "Payment declined by user or bank");
        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Restore inventory that was reserved during order placement
        rollbackOrderInventory(payment.getOrder());

        // Cancel the order
        Order order = payment.getOrder();
        order.setStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);

        return PaymentDTO.PaymentResponse.fromEntity(payment);
    }

    // ─── Private helpers ────────────────────────────────────────

    private boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String generatedSig = HexFormat.of().formatHex(hash);
            return generatedSig.equals(signature);
        } catch (Exception e) {
            log.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }

    private boolean checkInventoryAvailability(Order order) {
        if (order.getOrderItems() == null) return false;
        for (var item : order.getOrderItems()) {
            Book book = bookRepository.findById(item.getBook().getId()).orElse(null);
            if (book == null || book.getAvailableCopies() < item.getQuantity()) {
                return false;
            }
        }
        return true;
    }

    private void reduceInventory(Order order) {
        if (order.getOrderItems() == null) return;
        for (var item : order.getOrderItems()) {
            Book book = bookRepository.findById(item.getBook().getId()).orElse(null);
            if (book != null) {
                int newAvailable = book.getAvailableCopies() - item.getQuantity();
                book.setAvailableCopies(Math.max(0, newAvailable));
                if (book.getAvailableCopies() == 0) {
                    book.setStatus(Book.BookStatus.UNAVAILABLE);
                }
                bookRepository.save(book);
            }
        }
    }

    private void rollbackOrderInventory(Order order) {
        if (order == null || order.getOrderItems() == null) return;
        for (var item : order.getOrderItems()) {
            Book book = bookRepository.findById(item.getBook().getId()).orElse(null);
            if (book != null) {
                book.setAvailableCopies(book.getAvailableCopies() + item.getQuantity());
                book.setStatus(Book.BookStatus.AVAILABLE);
                bookRepository.save(book);
            }
        }
    }

    private String initiateRefund(String paymentId, Long amountPaise) {
        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", amountPaise);
            refundRequest.put("speed", "normal");
            refundRequest.put("notes", new JSONObject().put("reason", "Books out of stock"));
            Refund refund = client.payments.refund(paymentId, refundRequest);
            return refund.get("id");
        } catch (RazorpayException e) {
            log.error("Refund failed for paymentId {}: {}", paymentId, e.getMessage());
            return "REFUND_PENDING_" + paymentId;
        }
    }

    // ─── Query methods ────────────────────────────────────────

    public List<PaymentDTO.PaymentResponse> getUserPayments(Long userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(PaymentDTO.PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PaymentDTO.PaymentResponse> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(PaymentDTO.PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public PaymentDTO.PaymentResponse getPaymentByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .map(PaymentDTO.PaymentResponse::fromEntity)
                .orElse(null);
    }
}
