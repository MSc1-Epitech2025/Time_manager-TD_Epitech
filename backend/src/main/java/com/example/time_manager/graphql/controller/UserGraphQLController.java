package com.example.time_manager.graphql.controller;

import java.lang.reflect.Method;
import java.time.Duration;
import java.util.Optional;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.example.time_manager.dto.auth.AuthRequest;
import com.example.time_manager.dto.auth.AuthResponse;
import com.example.time_manager.dto.auth.RefreshRequest;
import com.example.time_manager.dto.auth.TokenPairResponse;
import com.example.time_manager.security.JwtUtil;
import com.example.time_manager.service.UserService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Controller
public class UserGraphQLController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    private static final boolean COOKIE_SECURE = true;
    private static final String COOKIE_SAMESITE = "None";
    private static final Duration ACCESS_MAX_AGE = Duration.ofMinutes(15);
    private static final Duration REFRESH_MAX_AGE = Duration.ofDays(7);

    public UserGraphQLController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    // =========================
    //          LOGIN
    // =========================
    @PreAuthorize("permitAll()")
    @MutationMapping
    public AuthResponse login(@Argument AuthRequest input) {
        HttpServletResponse httpResp = currentResponse();

        if (!userService.validateUser(input.getEmail(), input.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        var user = userService.findByEmail(input.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found after validation"));

        String accessToken = jwtUtil.generateAccessToken(
                user.getEmail(),
                user.getId(),
                user.getFirstName(),
                user.getRole()
        );

        String refreshToken = jwtUtil.generateRefreshToken(
                user.getEmail(),
                user.getId().toString()
        );

        addAccessCookie(httpResp, accessToken);
        addRefreshCookie(httpResp, refreshToken);
        return new AuthResponse(true);
    }

@PreAuthorize("permitAll()")
@MutationMapping
public AuthResponse refresh(@Argument Optional<RefreshRequest> input) {
    HttpServletRequest httpReq = currentRequest();
    HttpServletResponse httpResp = currentResponse();

    String refreshToken = input.map(UserGraphQLController::extractRefreshFromBody).orElse(null);
    if (refreshToken == null || refreshToken.isBlank()) {
        refreshToken = readCookie(httpReq, "refresh_token");
    }
    if (refreshToken == null || refreshToken.isBlank()) {
        throw new RuntimeException("Missing refresh token");
    }

    String username;
    try {
        username = jwtUtil.parseRefreshSubject(refreshToken);
    } catch (Exception e) {
        throw new RuntimeException("Invalid refresh token");
    }
    if (!jwtUtil.isRefreshTokenValid(refreshToken, username)) {
        throw new RuntimeException("Invalid or expired refresh token");
    }

    var user = userService.findByEmail(username)
        .orElseThrow(() -> new RuntimeException("User not found"));

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
    public Boolean logout() {
        HttpServletResponse httpResp = currentResponse();
        expireCookie(httpResp, "access_token", "/");          
        expireCookie(httpResp, "access_token", "/graphql");
        expireCookie(httpResp, "refresh_token", "/graphql");
        return true;
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
                .httpOnly(true).secure(COOKIE_SECURE).sameSite(COOKIE_SAMESITE)
                .path("/graphql")
                .maxAge(ACCESS_MAX_AGE).build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private static void addRefreshCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", token)
                .httpOnly(true).secure(COOKIE_SECURE).sameSite(COOKIE_SAMESITE)
                .path("/graphql")
                .maxAge(REFRESH_MAX_AGE).build();
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

    private static String extractRefreshFromBody(RefreshRequest req) {
        String v = tryCallGetter(req, "getRefreshToken");
        if (v != null && !v.isBlank()) {
            return v;
        }
        v = tryCallGetter(req, "getToken");
        if (v != null && !v.isBlank()) {
            return v;
        }
        v = tryCallGetter(req, "getRefresh");
        if (v != null && !v.isBlank()) {
            return v;
        }
        return null;
    }

    private static String tryCallGetter(Object bean, String getter) {
        try {
            Method m = bean.getClass().getMethod(getter);
            Object val = m.invoke(bean);
            return val != null ? val.toString() : null;
        } catch (Exception ignored) {
            return null;
        }
    }
}
