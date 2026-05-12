package com.library.dto;

import com.library.entity.Book;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class BookDTO {
    private Long id;

    @NotBlank
    private String title;

    @NotBlank
    private String author;

    private String genre;
    private String isbn;
    private String description;
    private String publisher;
    private LocalDate publicationDate;
    private int totalCopies;
    private int availableCopies;
    private String coverImage;
    private Book.BookStatus status;
    private Double averageRating;
    private int reviewCount;

    public static BookDTO fromEntity(Book book) {
        BookDTO dto = new BookDTO();
        dto.setId(book.getId());
        dto.setTitle(book.getTitle());
        dto.setAuthor(book.getAuthor());
        dto.setGenre(book.getGenre());
        dto.setIsbn(book.getIsbn());
        dto.setDescription(book.getDescription());
        dto.setPublisher(book.getPublisher());
        dto.setPublicationDate(book.getPublicationDate());
        dto.setTotalCopies(book.getTotalCopies());
        dto.setAvailableCopies(book.getAvailableCopies());
        dto.setCoverImage(book.getCoverImage());
        dto.setStatus(book.getStatus());
        return dto;
    }
}
