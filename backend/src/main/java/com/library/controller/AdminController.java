package com.library.controller;

import com.library.dto.*;
import com.library.entity.User;
import com.library.repository.UserRepository;
import com.library.service.BookService;
import com.library.service.BorrowService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    @Autowired private BookService bookService;
    @Autowired private BorrowService borrowService;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // Book management
    @PostMapping("/books")
    public ResponseEntity<BookDTO> createBook(@Valid @RequestBody BookDTO dto) {
        return ResponseEntity.ok(bookService.createBook(dto));
    }

    @PutMapping("/books/{id}")
    public ResponseEntity<BookDTO> updateBook(@PathVariable Long id, @Valid @RequestBody BookDTO dto) {
        return ResponseEntity.ok(bookService.updateBook(id, dto));
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok(Map.of("message", "Book deleted successfully"));
    }

    // User management
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream()
                .map(UserDTO::fromEntity).collect(Collectors.toList()));
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        if (userRepository.existsByUsername(body.get("username")))
            return ResponseEntity.badRequest().body(Map.of("message", "Username taken"));

        User user = new User();
        user.setUsername(body.get("username"));
        user.setPassword(passwordEncoder.encode(body.get("password")));
        user.setEmail(body.get("email"));
        user.setFullName(body.get("fullName"));
        user.setRole("ADMIN".equals(body.get("role")) ? User.Role.ADMIN : User.Role.USER);
        return ResponseEntity.ok(UserDTO.fromEntity(userRepository.save(user)));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (body.containsKey("email")) user.setEmail(body.get("email"));
        if (body.containsKey("fullName")) user.setFullName(body.get("fullName"));
        if (body.containsKey("role")) user.setRole("ADMIN".equals(body.get("role")) ? User.Role.ADMIN : User.Role.USER);
        return ResponseEntity.ok(UserDTO.fromEntity(userRepository.save(user)));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    // All borrows
    @GetMapping("/borrows")
    public ResponseEntity<List<BorrowRecordDTO>> getAllBorrows() {
        return ResponseEntity.ok(borrowService.getAllBorrows());
    }

    // Reports
    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports() {
        Map<String, Object> report = new HashMap<>();
        report.put("totalUsers", userRepository.count());
        report.put("totalBorrows", borrowService.getAllBorrows().size());
        report.put("activeBorrows", borrowService.getAllBorrows().stream()
                .filter(b -> b.getStatus().name().equals("BORROWED")).count());
        return ResponseEntity.ok(report);
    }

    // Admin Orders (delegated to OrderController /api/orders/admin/*)

}
