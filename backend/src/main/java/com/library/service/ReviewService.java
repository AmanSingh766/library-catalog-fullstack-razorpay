package com.library.service;

import com.library.dto.ReviewDTO;
import com.library.entity.*;
import com.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private BookRepository bookRepository;
    @Autowired private UserRepository userRepository;

    public ReviewDTO addReview(Long userId, Long bookId, int rating, String comment) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookRepository.findById(bookId).orElseThrow(() -> new RuntimeException("Book not found"));

        Review review = new Review();
        review.setUser(user);
        review.setBook(book);
        review.setRating(rating);
        review.setComment(comment);

        return ReviewDTO.fromEntity(reviewRepository.save(review));
    }

    public List<ReviewDTO> getBookReviews(Long bookId) {
        return reviewRepository.findByBookId(bookId)
                .stream().map(ReviewDTO::fromEntity).collect(Collectors.toList());
    }
}
