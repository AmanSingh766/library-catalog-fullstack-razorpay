package com.library.repository;

import com.library.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Only top-level comments (no parent) for a book
    List<Comment> findByBookIdAndParentIsNullOrderByCreatedAtDesc(Long bookId);
}
