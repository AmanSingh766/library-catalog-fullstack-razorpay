package com.library.controller;

import com.library.dto.CommentDTO;
import com.library.security.UserDetailsImpl;
import com.library.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired private CommentService commentService;

    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<CommentDTO>> getBookComments(@PathVariable Long bookId) {
        return ResponseEntity.ok(commentService.getBookComments(bookId));
    }

    @PostMapping("/book/{bookId}")
    public ResponseEntity<CommentDTO> addComment(
            @PathVariable Long bookId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetailsImpl user) {
        String content = body.get("content").toString();
        Long parentId = body.containsKey("parentId") && body.get("parentId") != null
                ? Long.parseLong(body.get("parentId").toString()) : null;
        return ResponseEntity.ok(commentService.addComment(user.getId(), bookId, content, parentId));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentDTO> editComment(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(commentService.editComment(commentId, user.getId(), body.get("content")));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        commentService.deleteComment(commentId, user.getId(), isAdmin);
        return ResponseEntity.ok(Map.of("message", "Comment deleted"));
    }
}
