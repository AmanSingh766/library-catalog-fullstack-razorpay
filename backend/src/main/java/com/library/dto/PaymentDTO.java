package com.library.dto;

import com.library.entity.Payment;
import lombok.Data;
import java.time.LocalDateTime;

public class PaymentDTO {

    @Data
    public static class CreateOrderResponse {
        private String razorpayOrderId;
        private Long amountPaise;
        private String currency;
        private String keyId;
        private Long libraryOrderId;
        private String userEmail;
        private String userName;
    }

    @Data
    public static class VerifyRequest {
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
    }

    @Data
    public static class PaymentResponse {
        private Long id;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private Long libraryOrderId;
        private Long amountPaise;
        private String currency;
        private Payment.PaymentStatus status;
        private String failureReason;
        private String refundId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static PaymentResponse fromEntity(Payment p) {
            PaymentResponse r = new PaymentResponse();
            r.setId(p.getId());
            r.setRazorpayOrderId(p.getRazorpayOrderId());
            r.setRazorpayPaymentId(p.getRazorpayPaymentId());
            r.setLibraryOrderId(p.getOrder() != null ? p.getOrder().getId() : null);
            r.setAmountPaise(p.getAmountPaise());
            r.setCurrency(p.getCurrency());
            r.setStatus(p.getStatus());
            r.setFailureReason(p.getFailureReason());
            r.setRefundId(p.getRefundId());
            r.setCreatedAt(p.getCreatedAt());
            r.setUpdatedAt(p.getUpdatedAt());
            return r;
        }
    }
}
