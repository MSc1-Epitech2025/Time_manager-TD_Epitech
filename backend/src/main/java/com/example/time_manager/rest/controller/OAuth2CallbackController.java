package com.example.time_manager.rest.controller;

import com.example.time_manager.model.User;
import com.example.time_manager.security.JwtUtil;
import com.example.time_manager.service.UserService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;

@RestController
public class OAuth2CallbackController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public OAuth2CallbackController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/oauth2/success")
    public ResponseEntity<Void> handleAzureCallback(Authentication auth, HttpServletResponse response) {
        if (auth == null) {
            throw new RuntimeException("No auth context");
        }

        var principal = (org.springframework.security.oauth2.core.oidc.user.OidcUser) auth.getPrincipal();
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
                .httpOnly(true).secure(true).sameSite("None").path("/graphql").build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true).secure(true).sameSite("None").path("/graphql").build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return ResponseEntity.ok().build();
    }
}
