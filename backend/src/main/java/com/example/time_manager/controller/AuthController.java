package com.example.time_manager.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.time_manager.dto.auth.AuthRequest;
import com.example.time_manager.dto.auth.RefreshRequest;
import com.example.time_manager.dto.auth.TokenPairResponse;
import com.example.time_manager.model.User;
import com.example.time_manager.security.JwtUtil;
import com.example.time_manager.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;
    private final UserDetailsService userDetailsService;

    public AuthController(UserService userService,
                          JwtUtil jwtUtil,
                          AuthenticationManager authManager,
                          UserDetailsService userDetailsService) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.authManager = authManager;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Login: returns Access + Refresh tokens.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AuthRequest request) {
        try {
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            String access  = jwtUtil.generateAccessToken(request.getEmail());
            String refresh = jwtUtil.generateRefreshToken(request.getEmail());
            return ResponseEntity.ok(new TokenPairResponse(access, refresh));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    /**
     * Refresh: validate the refresh token and issue a new pair (rotation).
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody @Valid RefreshRequest req) {
        try {
            // Extract subject & validate with refresh key
            // (jwtUtil vérifie l’expiration et le sujet)
            String subject = jwtUtil.parseRefreshSubject(req.refreshToken());
            if (!jwtUtil.isRefreshTokenValid(req.refreshToken(), subject)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
            }

            // Optionnel: recharger l'utilisateur pour s'assurer qu'il existe toujours / n'est pas désactivé
            userDetailsService.loadUserByUsername(subject);

            String newAccess  = jwtUtil.generateAccessToken(subject);
            String newRefresh = jwtUtil.generateRefreshToken(subject); // rotation
            return ResponseEntity.ok(new TokenPairResponse(newAccess, newRefresh));
        } catch (UsernameNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
        }
    }

    /**
     * Register: simple user creation (defaults to ["employee"] if role is blank).
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userService.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("[\"employee\"]");
        }
        userService.saveUser(user);
        return ResponseEntity.ok("User registered successfully");
    }
}
