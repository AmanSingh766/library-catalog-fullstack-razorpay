package com.library.service;

import com.library.dto.OrderDTO;
import com.library.entity.*;
import com.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private BookRepository bookRepository;
    @Autowired private UserRepository userRepository;

    @Transactional
    public OrderDTO placeOrderFromCart(Long userId, String notes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<CartItem> cartItems = cartItemRepository.findByUser(user);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // Check availability for all items first
        for (CartItem ci : cartItems) {
            if (ci.getBook().getAvailableCopies() < ci.getQuantity()) {
                throw new RuntimeException("Not enough copies available for: " + ci.getBook().getTitle());
            }
        }

        // Create order
        Order order = new Order();
        order.setUser(user);
        order.setNotes(notes);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        int total = cartItems.stream().mapToInt(CartItem::getQuantity).sum();
        order.setTotalItems(total);
        Order savedOrder = orderRepository.save(order);

        // Create order items — inventory NOT reduced here
        // Inventory is only reduced AFTER successful payment (PaymentService)
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem ci : cartItems) {
            OrderItem oi = new OrderItem();
            oi.setOrder(savedOrder);
            oi.setBook(ci.getBook());
            oi.setQuantity(ci.getQuantity());
            orderItems.add(oi);
            // No inventory change here — payment handles it
        }
        orderItemRepository.saveAll(orderItems);
        savedOrder.setOrderItems(orderItems);

        // Clear cart
        cartItemRepository.deleteByUser(user);

        return OrderDTO.fromEntity(savedOrder);
    }

    public List<OrderDTO> getUserOrders(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(OrderDTO::fromEntity).collect(Collectors.toList());
    }

    public OrderDTO getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getUser().getId().equals(userId)) throw new RuntimeException("Unauthorized");
        return OrderDTO.fromEntity(order);
    }

    @Transactional
    public OrderDTO cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getUser().getId().equals(userId)) throw new RuntimeException("Unauthorized");
        if (order.getStatus() == Order.OrderStatus.COMPLETED || order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("Cannot cancel this order");
        }

        // Restore book copies
        if (order.getOrderItems() != null) {
            for (OrderItem oi : order.getOrderItems()) {
                Book book = oi.getBook();
                book.setAvailableCopies(book.getAvailableCopies() + oi.getQuantity());
                book.setStatus(Book.BookStatus.AVAILABLE);
                bookRepository.save(book);
            }
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        return OrderDTO.fromEntity(orderRepository.save(order));
    }

    // Admin
    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(OrderDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        order.setUpdatedAt(LocalDateTime.now());
        return OrderDTO.fromEntity(orderRepository.save(order));
    }
}
