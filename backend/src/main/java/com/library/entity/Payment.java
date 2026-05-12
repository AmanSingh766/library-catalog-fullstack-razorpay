package com.library.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Razorpay order ID (rzp_order_xxx)
    @Column(name = "razorpay_order_id", unique = true)
    private String razorpayOrderId;

    // Razorpay payment ID after user pays (pay_xxx)
    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    // Razorpay signature for verification
    @Column(name = "razorpay_signature")
    private String razorpaySignature;

    // Our library order
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Amount in paise (INR × 100)
    @Column(name = "amount_paise", nullable = false)
    private Long amountPaise;

    @Column(name = "currency", nullable = false)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.CREATED;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "refund_id")
    private String refundId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum PaymentStatus {
        CREATED,      // Razorpay order created, payment pending
        PAID,         // Payment received & verified
        FAILED,       // Payment failed / declined
        REFUNDED,     // Payment reversed
        INVENTORY_FAIL // Paid but stock not available → auto refund
    }
}
