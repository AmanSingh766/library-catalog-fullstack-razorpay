package com.library.controller;

import com.library.dto.PaymentDTO;
import com.library.security.UserDetailsImpl;
import com.library.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    /**
     * Step 1: Create Razorpay order for a library order
     * Frontend calls this → gets razorpay order id → opens Razorpay modal
     */
    @PostMapping("/create-order/{libraryOrderId}")
    public ResponseEntity<PaymentDTO.CreateOrderResponse> createOrder(
            @PathVariable Long libraryOrderId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(
                paymentService.createRazorpayOrder(libraryOrderId, user.getId())
        );
    }

    /**
     * Step 2: After Razorpay payment success — verify signature + check inventory
     * If inventory OK → order COMPLETED
     * If inventory fail → auto refund → order CANCELLED
     */
    @PostMapping("/verify")
    public ResponseEntity<PaymentDTO.PaymentResponse> verifyPayment(
            @RequestBody PaymentDTO.VerifyRequest req) {
        return ResponseEntity.ok(paymentService.verifyAndProcessPayment(req));
    }

    /**
     * Step 3: Payment failed from frontend (user cancelled / bank declined)
     * Rolls back inventory reservation + cancels order
     */
    @PostMapping("/failure")
    public ResponseEntity<PaymentDTO.PaymentResponse> paymentFailure(
            @RequestBody Map<String, String> body) {
        String orderId = body.get("razorpayOrderId");
        String reason = body.getOrDefault("reason", "Payment failed");
        return ResponseEntity.ok(paymentService.handlePaymentFailure(orderId, reason));
    }

    /**
     * Get payment status for a library order
     */
    @GetMapping("/order/{libraryOrderId}")
    public ResponseEntity<?> getPaymentByOrder(@PathVariable Long libraryOrderId) {
        PaymentDTO.PaymentResponse payment = paymentService.getPaymentByOrderId(libraryOrderId);
        if (payment == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(payment);
    }

    /**
     * My payment history
     */
    @GetMapping("/my-payments")
    public ResponseEntity<List<PaymentDTO.PaymentResponse>> getMyPayments(
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(paymentService.getUserPayments(user.getId()));
    }

    /**
     * Admin: All payments
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PaymentDTO.PaymentResponse>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }
}
