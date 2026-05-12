package com.library.dto;

import com.library.entity.CartItem;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CartItemDTO {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookGenre;
    private int availableCopies;
    private int quantity;
    private LocalDateTime addedAt;

    public static CartItemDTO fromEntity(CartItem item) {
        CartItemDTO dto = new CartItemDTO();
        dto.setId(item.getId());
        dto.setBookId(item.getBook().getId());
        dto.setBookTitle(item.getBook().getTitle());
        dto.setBookAuthor(item.getBook().getAuthor());
        dto.setBookGenre(item.getBook().getGenre());
        dto.setAvailableCopies(item.getBook().getAvailableCopies());
        dto.setQuantity(item.getQuantity());
        dto.setAddedAt(item.getAddedAt());
        return dto;
    }
}
