package com.library.service;

import com.library.dto.BorrowRecordDTO;
import com.library.entity.*;
import com.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BorrowService {
    @Autowired private BorrowRecordRepository borrowRecordRepository;
    @Autowired private BookRepository bookRepository;
    @Autowired private UserRepository userRepository;

    @Transactional
    public BorrowRecordDTO borrowBook(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        if (book.getAvailableCopies() <= 0) {
            throw new RuntimeException("No copies available");
        }

        borrowRecordRepository.findByUserAndBookAndStatus(user, book, BorrowRecord.BorrowStatus.BORROWED)
                .ifPresent(r -> { throw new RuntimeException("You already borrowed this book"); });

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        if (book.getAvailableCopies() == 0) book.setStatus(Book.BookStatus.UNAVAILABLE);
        bookRepository.save(book);

        BorrowRecord record = new BorrowRecord();
        record.setUser(user);
        record.setBook(book);
        record.setBorrowDate(LocalDate.now());
        record.setDueDate(LocalDate.now().plusDays(14));
        record.setStatus(BorrowRecord.BorrowStatus.BORROWED);

        return BorrowRecordDTO.fromEntity(borrowRecordRepository.save(record));
    }

    @Transactional
    public BorrowRecordDTO returnBook(Long recordId, Long userId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Borrow record not found"));

        if (!record.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (record.getStatus() == BorrowRecord.BorrowStatus.RETURNED) {
            throw new RuntimeException("Book already returned");
        }

        record.setReturnDate(LocalDate.now());
        record.setStatus(BorrowRecord.BorrowStatus.RETURNED);

        Book book = record.getBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        book.setStatus(Book.BookStatus.AVAILABLE);
        bookRepository.save(book);

        return BorrowRecordDTO.fromEntity(borrowRecordRepository.save(record));
    }

    @Transactional
    public BorrowRecordDTO reserveBook(Long userId, Long bookId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookRepository.findById(bookId).orElseThrow(() -> new RuntimeException("Book not found"));

        BorrowRecord record = new BorrowRecord();
        record.setUser(user);
        record.setBook(book);
        record.setBorrowDate(LocalDate.now());
        record.setDueDate(LocalDate.now().plusDays(3));
        record.setStatus(BorrowRecord.BorrowStatus.RESERVED);

        return BorrowRecordDTO.fromEntity(borrowRecordRepository.save(record));
    }

    public List<BorrowRecordDTO> getUserBorrowHistory(Long userId) {
        return borrowRecordRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(BorrowRecordDTO::fromEntity).collect(Collectors.toList());
    }

    public List<BorrowRecordDTO> getUserActiveBorrows(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return borrowRecordRepository.findByUserAndStatus(user, BorrowRecord.BorrowStatus.BORROWED)
                .stream().map(BorrowRecordDTO::fromEntity).collect(Collectors.toList());
    }

    public List<BorrowRecordDTO> getAllBorrows() {
        return borrowRecordRepository.findAll().stream()
                .map(BorrowRecordDTO::fromEntity).collect(Collectors.toList());
    }
}
