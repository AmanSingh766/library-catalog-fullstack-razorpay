package com.library.dto;

import com.library.entity.Order;
import com.library.entity.OrderItem;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class OrderDTO {
    private Long id;
    private Long userId;
    private String username;
    private List<OrderItemDTO> items;
    private Order.OrderStatus status;
    private int totalItems;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class OrderItemDTO {
        private Long id;
        private Long bookId;
        private String bookTitle;
        private String bookAuthor;
        private int quantity;

        public static OrderItemDTO fromEntity(OrderItem item) {
            OrderItemDTO dto = new OrderItemDTO();
            dto.setId(item.getId());
            dto.setBookId(item.getBook().getId());
            dto.setBookTitle(item.getBook().getTitle());
            dto.setBookAuthor(item.getBook().getAuthor());
            dto.setQuantity(item.getQuantity());
            return dto;
        }
    }

    public static OrderDTO fromEntity(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setUserId(order.getUser().getId());
        dto.setUsername(order.getUser().getUsername());
        dto.setStatus(order.getStatus());
        dto.setTotalItems(order.getTotalItems());
        dto.setNotes(order.getNotes());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        if (order.getOrderItems() != null) {
            dto.setItems(order.getOrderItems().stream()
                    .map(OrderItemDTO::fromEntity)
                    .collect(Collectors.toList()));
        }
        return dto;
    }
}
