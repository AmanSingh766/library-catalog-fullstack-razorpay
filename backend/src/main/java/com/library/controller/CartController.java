package com.library.controller;

import com.library.dto.CartItemDTO;
import com.library.security.UserDetailsImpl;
import com.library.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired private CartService cartService;

    @GetMapping
    public ResponseEntity<List<CartItemDTO>> getCart(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(cartService.getCart(user.getId()));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getCartCount(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(Map.of("count", cartService.getCartCount(user.getId())));
    }

    @PostMapping("/add/{bookId}")
    public ResponseEntity<CartItemDTO> addToCart(
            @PathVariable Long bookId,
            @RequestBody(required = false) Map<String, Integer> body,
            @AuthenticationPrincipal UserDetailsImpl user) {
        int qty = (body != null && body.containsKey("quantity")) ? body.get("quantity") : 1;
        return ResponseEntity.ok(cartService.addToCart(user.getId(), bookId, qty));
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<?> updateQuantity(
            @PathVariable Long cartItemId,
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal UserDetailsImpl user) {
        CartItemDTO updated = cartService.updateQuantity(user.getId(), cartItemId, body.get("quantity"));
        if (updated == null) return ResponseEntity.ok(Map.of("message", "Item removed from cart"));
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<?> removeFromCart(
            @PathVariable Long cartItemId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        cartService.removeFromCart(user.getId(), cartItemId);
        return ResponseEntity.ok(Map.of("message", "Removed from cart"));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(@AuthenticationPrincipal UserDetailsImpl user) {
        cartService.clearCart(user.getId());
        return ResponseEntity.ok(Map.of("message", "Cart cleared"));
    }
}
