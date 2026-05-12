package com.library.service;

import com.library.dto.BookDTO;
import com.library.entity.Book;
import com.library.repository.BookRepository;
import com.library.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookService {
    @Autowired private BookRepository bookRepository;
    @Autowired private ReviewRepository reviewRepository;

    public Page<BookDTO> getAllBooks(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        return bookRepository.findAll(pageable).map(this::toDTO);
    }

    public Page<BookDTO> searchBooks(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return bookRepository.searchBooks(keyword, pageable).map(this::toDTO);
    }

    public BookDTO getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        return toDTO(book);
    }

    public BookDTO createBook(BookDTO dto) {
        Book book = new Book();
        mapDTOToEntity(dto, book);
        book.setAvailableCopies(dto.getTotalCopies());
        return toDTO(bookRepository.save(book));
    }

    public BookDTO updateBook(Long id, BookDTO dto) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        mapDTOToEntity(dto, book);
        return toDTO(bookRepository.save(book));
    }

    public void deleteBook(Long id) {
        bookRepository.deleteById(id);
    }

    public List<String> getAllGenres() {
        return bookRepository.findAllGenres();
    }

    private BookDTO toDTO(Book book) {
        BookDTO dto = BookDTO.fromEntity(book);
        Double avg = reviewRepository.findAverageRatingByBookId(book.getId());
        dto.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        dto.setReviewCount(reviewRepository.findByBookId(book.getId()).size());
        return dto;
    }

    private void mapDTOToEntity(BookDTO dto, Book book) {
        book.setTitle(dto.getTitle());
        book.setAuthor(dto.getAuthor());
        book.setGenre(dto.getGenre());
        book.setIsbn(dto.getIsbn());
        book.setDescription(dto.getDescription());
        book.setPublisher(dto.getPublisher());
        book.setPublicationDate(dto.getPublicationDate());
        book.setTotalCopies(dto.getTotalCopies() > 0 ? dto.getTotalCopies() : 1);
        book.setCoverImage(dto.getCoverImage());
        if (dto.getStatus() != null) book.setStatus(dto.getStatus());
    }

    public Book getBookEntity(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
    }

    public void save(Book book) {
        bookRepository.save(book);
    }
}
