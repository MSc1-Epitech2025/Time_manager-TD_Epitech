package com.example.time_manager.graphql.controller;

import java.time.Duration;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.example.time_manager.dto.auth.AuthRequest;
import com.example.time_manager.dto.auth.AuthResponse;
import com.example.time_manager.dto.auth.ChangePasswordInput;
import com.example.time_manager.dto.auth.CreateUserInput;
import com.example.time_manager.dto.auth.ResetPasswordInput;
import com.example.time_manager.dto.auth.ResetPasswordRequestInput;
import com.example.time_manager.dto.auth.UpdateUserInput;
import com.example.time_manager.model.User;
import com.example.time_manager.security.JwtUtil;
import com.example.time_manager.security.PasswordGenerator;
import com.example.time_manager.service.UserService;
import com.example.time_manager.service.auth.PasswordResetService;

import jakarta.security.auth.message.AuthException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Controller
public class UserGraphQLController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordResetService passwordResetService;
    
    private static final boolean COOKIE_SECURE = true;
    private static final String COOKIE_SAMESITE = "None";
    private static final Duration ACCESS_MAX_AGE = Duration.ofMinutes(15);
    private static final Duration REFRESH_MAX_AGE = Duration.ofDays(7);

    public UserGraphQLController(UserService userService, JwtUtil jwtUtil,PasswordResetService passwordResetService) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.passwordResetService = passwordResetService;
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @MutationMapping
    public User register(@Argument CreateUserInput input) throws AuthException {
        if (userService.findByEmail(input.email()).isPresent()) {
            throw new AuthException("Email already exists: " + input.email());
        }

        User u = new User();
        u.setFirstName(input.firstName());
        u.setLastName(input.lastName());
        u.setEmail(input.email());
        u.setPhone(input.phone());
        u.setRole(input.role());
        u.setPoste(input.poste());
        u.setAvatarUrl(input.avatarUrl());

        String tempPwd = PasswordGenerator.generate(14);
        u.setPassword(tempPwd);

        User saved = userService.saveUser(u);

    passwordResetService.sendSetPasswordEmailFor(saved, tempPwd);

        return saved;
    }


    @PreAuthorize("hasAuthority('ADMIN')")
    @MutationMapping
    public Boolean deleteUser(@Argument("id") String id) {
        userService.deleteById(id);
        return true;
    }

    @PreAuthorize("permitAll()")
    @MutationMapping
    public AuthResponse refresh() throws AuthException {
        HttpServletRequest httpReq = currentRequest();
        HttpServletResponse httpResp = currentResponse();

        String refreshToken = readCookie(httpReq, "refresh_token");
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new AuthException("Missing refresh token");
        }

        String username = jwtUtil.parseRefreshSubject(refreshToken);

        if (!jwtUtil.isRefreshTokenValid(refreshToken, username)) {
            throw new AuthException("Invalid or expired refresh token");
        }

        var user = userService.findByEmail(username)
                .orElseThrow(() -> new AuthException("User not found"));

        String newAccess = jwtUtil.generateAccessToken(
                user.getEmail(),
                user.getId(),
                user.getFirstName(),
                user.getRole()
        );

        addAccessCookie(httpResp, newAccess);

        return new AuthResponse(true);
    }

    @PreAuthorize("permitAll()")
    @MutationMapping
    public AuthResponse login(@Argument AuthRequest input) {
        HttpServletResponse httpResp = currentResponse();

        if (!userService.validateUser(input.getEmail(), input.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        var user = userService.findByEmail(input.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found after validation"));
        
        // Return first connection status
        boolean isFirstConnection = user.isFirstConnection();
        
        String accessToken = jwtUtil.generateAccessToken(
                user.getEmail(),
                user.getId(),
                user.getFirstName(),
                user.getRole()
        );

        String refreshToken = jwtUtil.generateRefreshToken(
                user.getEmail(),
                user.getId()
        );

        addAccessCookie(httpResp, accessToken);
        addRefreshCookie(httpResp, refreshToken);
        return new AuthResponse(true, isFirstConnection);
    }

    @PreAuthorize("permitAll()")
    @MutationMapping
    public AuthResponse requestPasswordReset(@Argument("input") ResetPasswordRequestInput input) {
        passwordResetService.requestResetByEmail(input.email());
        return new AuthResponse(true);
    }

    @PreAuthorize("permitAll()")
    @MutationMapping
    public AuthResponse requestPasswordResetWithTemp(@Argument("input") ResetPasswordRequestInput input) {
        try {
            passwordResetService.requestResetWithTempPassword(input.email());
            return new AuthResponse(true);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    @PreAuthorize("permitAll()")
    @MutationMapping
    public AuthResponse resetPassword(@Argument("input") ResetPasswordInput input) {
        passwordResetService.resetPassword(input.token(), input.newPassword());
        return new AuthResponse(true);
    }

    @PreAuthorize("isAuthenticated()")
    @MutationMapping
    public AuthResponse changeMyPassword(@Argument("input") ChangePasswordInput input) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        userService.changePassword(email, input.currentPassword(), input.newPassword());
        
        // Mark first login complete
        var user = userService.findByEmail(email);
        if (user.isPresent()) {
            userService.completeFirstLogin(user.get().getId());
        }
        
        return new AuthResponse(true);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @MutationMapping
    public User updateUser(@Argument("input") UpdateUserInput input) {
        return userService.updateUser(input.id(), input);
    }

    @PreAuthorize("permitAll()")
    @MutationMapping
    public Boolean logout() {
        HttpServletResponse httpResp = currentResponse();
        expireCookie(httpResp, "access_token", "/");
        expireCookie(httpResp, "access_token", "/graphql");
        expireCookie(httpResp, "refresh_token", "/graphql");
        return true;
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @QueryMapping
    public java.util.List<User> users() {
        var list = userService.findAllUsers();
        return (list != null) ? list : java.util.Collections.emptyList();
    }

    @PreAuthorize("isAuthenticated()")
    @QueryMapping
    public User userByEmail(@Argument("email") String email) {
        return userService.findByEmail(email).orElse(null);
    }

    private static HttpServletRequest currentRequest() {
        var attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
        return attrs.getRequest();
    }

    private static HttpServletResponse currentResponse() {
        var attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
        HttpServletResponse resp = attrs.getResponse();
        if (resp == null) {
            throw new IllegalStateException("No HttpServletResponse available");
        }
        return resp;
    }

    private static void addAccessCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("access_token", token)
                .httpOnly(true)
                .secure(COOKIE_SECURE)
                .sameSite(COOKIE_SAMESITE)
                .path("/graphql")
                .maxAge(ACCESS_MAX_AGE)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private static void expireCookie(HttpServletResponse response, String name, String path) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(COOKIE_SECURE)
                .sameSite(COOKIE_SAMESITE)
                .path(path)
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private static void addRefreshCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", token)
                .httpOnly(true).secure(COOKIE_SECURE).sameSite(COOKIE_SAMESITE)
                .path("/graphql")
                .maxAge(REFRESH_MAX_AGE).build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private static String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }
}
