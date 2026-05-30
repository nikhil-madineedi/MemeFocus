package com.memefocus.controller;

import com.memefocus.model.User;
import com.memefocus.repository.UserRepository;
import com.memefocus.security.TokenStore;
import jakarta.servlet.http.HttpServletRequest;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    // Request DTOs as Records (Clean Java features)
    public record LoginRequest(String email, String password) {}
    public record SignupRequest(String name, String email, String password) {}
    public record ProfileUpdateRequest(String name, String email, int defaultFocusDuration, int defaultBreakDuration) {}

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (request.email() == null || request.email().trim().isEmpty() ||
            request.password() == null || request.password().trim().isEmpty() ||
            request.name() == null || request.name().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields are required"));
        }

        if (userRepository.findByEmail(request.email().trim().toLowerCase()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already in use"));
        }

        // Create new user with BCrypt hashed password
        User user = new User(
                request.name().trim(),
                request.email().trim().toLowerCase(),
                BCrypt.hashpw(request.password(), BCrypt.gensalt())
        );

        User savedUser = userRepository.save(user);
        String token = TokenStore.generateToken(savedUser.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", savedUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(request.email().trim().toLowerCase());
        if (userOpt.isEmpty() || !BCrypt.checkpw(request.password(), userOpt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }

        User user = userOpt.get();
        String token = TokenStore.generateToken(user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(userOpt.get());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody ProfileUpdateRequest requestBody, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        user.setName(requestBody.name().trim());
        user.setEmail(requestBody.email().trim().toLowerCase());
        user.setDefaultFocusDuration(requestBody.defaultFocusDuration());
        user.setDefaultBreakDuration(requestBody.defaultBreakDuration());

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String token = request.getHeader("X-Auth-Token");
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }
        TokenStore.removeToken(token);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
