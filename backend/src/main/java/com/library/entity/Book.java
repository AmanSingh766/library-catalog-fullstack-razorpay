package com.library.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "books")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    private String genre;

    @Column(unique = true)
    private String isbn;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String publisher;

    @Column(name = "publication_date")
    private LocalDate publicationDate;

    @Column(name = "total_copies")
    private int totalCopies = 1;

    @Column(name = "available_copies")
    private int availableCopies = 1;

    @Column(name = "cover_image")
    private String coverImage;

    @Enumerated(EnumType.STRING)
    private BookStatus status = BookStatus.AVAILABLE;

    public enum BookStatus {
        AVAILABLE, UNAVAILABLE
    }
}
