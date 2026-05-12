package com.library.service;

import com.library.dto.CommentDTO;
import com.library.entity.*;
import com.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired private CommentRepository commentRepository;
    @Autowired private BookRepository bookRepository;
    @Autowired private UserRepository userRepository;

    public List<CommentDTO> getBookComments(Long bookId) {
        return commentRepository.findByBookIdAndParentIsNullOrderByCreatedAtDesc(bookId)
                .stream().map(CommentDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public CommentDTO addComment(Long userId, Long bookId, String content, Long parentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        Comment comment = new Comment();
        comment.setUser(user);
        comment.setBook(book);
        comment.setContent(content);

        if (parentId != null) {
            Comment parent = commentRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setParent(parent);
        }

        return CommentDTO.fromEntity(commentRepository.save(comment));
    }

    @Transactional
    public CommentDTO editComment(Long commentId, Long userId, String newContent) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: you can only edit your own comments");
        }
        comment.setContent(newContent);
        comment.setEdited(true);
        comment.setUpdatedAt(LocalDateTime.now());
        return CommentDTO.fromEntity(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId, boolean isAdmin) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        if (!isAdmin && !comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        commentRepository.delete(comment);
    }
}
