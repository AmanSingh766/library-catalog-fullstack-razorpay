package com.library.repository;

import com.library.entity.BorrowRecord;
import com.library.entity.User;
import com.library.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {
    List<BorrowRecord> findByUser(User user);
    List<BorrowRecord> findByUserAndStatus(User user, BorrowRecord.BorrowStatus status);
    Optional<BorrowRecord> findByUserAndBookAndStatus(User user, Book book, BorrowRecord.BorrowStatus status);

    @Query("SELECT b.book.id, COUNT(b) as cnt FROM BorrowRecord b GROUP BY b.book.id ORDER BY cnt DESC")
    List<Object[]> findMostBorrowedBooks();

    @Query("SELECT COUNT(b) FROM BorrowRecord b WHERE b.status = 'BORROWED'")
    Long countActiveBorrows();

    List<BorrowRecord> findByStatus(BorrowRecord.BorrowStatus status);

    @Query("SELECT b FROM BorrowRecord b WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    List<BorrowRecord> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}
