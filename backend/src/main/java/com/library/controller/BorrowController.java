package com.library.controller;

import com.library.dto.BorrowRecordDTO;
import com.library.security.UserDetailsImpl;
import com.library.service.BorrowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/borrow")
public class BorrowController {
    @Autowired private BorrowService borrowService;

    @PostMapping("/{bookId}")
    public ResponseEntity<BorrowRecordDTO> borrowBook(
            @PathVariable Long bookId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(borrowService.borrowBook(user.getId(), bookId));
    }

    @PostMapping("/return/{recordId}")
    public ResponseEntity<BorrowRecordDTO> returnBook(
            @PathVariable Long recordId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(borrowService.returnBook(recordId, user.getId()));
    }

    @PostMapping("/reserve/{bookId}")
    public ResponseEntity<BorrowRecordDTO> reserveBook(
            @PathVariable Long bookId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(borrowService.reserveBook(user.getId(), bookId));
    }

    @GetMapping("/my-borrows")
    public ResponseEntity<List<BorrowRecordDTO>> getMyBorrows(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(borrowService.getUserActiveBorrows(user.getId()));
    }

    @GetMapping("/my-history")
    public ResponseEntity<List<BorrowRecordDTO>> getMyHistory(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(borrowService.getUserBorrowHistory(user.getId()));
    }
}
