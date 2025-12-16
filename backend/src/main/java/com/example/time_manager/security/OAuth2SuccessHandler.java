package com.example.time_manager.security;

import com.example.time_manager.model.User;
import com.example.time_manager.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Value("${FRONTEND_URL}")
    private String frontendUrl;

    public OAuth2SuccessHandler(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        OidcUser principal = (OidcUser) authentication.getPrincipal();
        String email = principal.getEmail();
        String azureOid = principal.getClaim("oid");

        User user = userService.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setFirstName(principal.getGivenName());
            u.setLastName(principal.getFamilyName());
            u.setPassword("oauth2");
            u.setRole("[\"employee\"]");
            u.setAzureOid(azureOid);
            return userService.saveUser(u);
        });

        if (user.getAzureOid() == null || user.getAzureOid().isBlank()) {
            user.setAzureOid(azureOid);
            userService.saveUser(user);
        }

        String accessToken = jwtUtil.generateAccessToken(
                user.getEmail(), user.getId(), user.getFirstName(), user.getRole()
        );
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), user.getId());

        ResponseCookie accessCookie = ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)
                .secure(false)
                .sameSite("None")
                .path("/")
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(false)
                .sameSite("None")
                .path("/")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        String redirectUrl = String.format(
                "%sauth/callback?email=%s&firstName=%s&lastName=%s&id=%s&role=%s",
                frontendUrl,
                URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8),
                URLEncoder.encode(user.getFirstName(), StandardCharsets.UTF_8),
                URLEncoder.encode(user.getLastName(), StandardCharsets.UTF_8),
                user.getId(),
                URLEncoder.encode(user.getRole(), StandardCharsets.UTF_8)
        );

        response.sendRedirect(redirectUrl);
    }
}
