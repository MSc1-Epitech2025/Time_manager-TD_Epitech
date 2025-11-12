package com.example.time_manager.controllers;

import com.example.time_manager.model.User;
import com.example.time_manager.rest.controller.OAuth2CallbackController;
import com.example.time_manager.security.JwtUtil;
import com.example.time_manager.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OAuth2CallbackControllerTest {

    private UserService userService;
    private JwtUtil jwtUtil;
    private OAuth2CallbackController controller;
    private Authentication authentication;
    private HttpServletResponse response;
    private OidcUser principal;

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        jwtUtil = mock(JwtUtil.class);
        authentication = mock(Authentication.class);
        response = mock(HttpServletResponse.class);
        principal = mock(OidcUser.class);
        controller = new OAuth2CallbackController(userService, jwtUtil);
    }

    @Test
    void testHandleAzureCallback_NoAuth_Throws() {
        assertThrows(RuntimeException.class, () ->
                controller.handleAzureCallback(null, response));
    }

    @Test
    void testHandleAzureCallback_UserAlreadyExists_WithMissingAzureOid() {
        // --- Arrange ---
        when(authentication.getPrincipal()).thenReturn(principal);
        when(principal.getEmail()).thenReturn("test@example.com");
        when(principal.getClaim("oid")).thenReturn("AZURE-123");
        when(principal.getGivenName()).thenReturn("John");
        when(principal.getFamilyName()).thenReturn("Doe");

        User existing = new User();
        existing.setId("U1");
        existing.setEmail("test@example.com");
        existing.setFirstName("John");
        existing.setLastName("Doe");
        existing.setAzureOid(""); // simulate missing azureOid
        existing.setRole("[\"employee\"]");

        when(userService.findByEmail("test@example.com")).thenReturn(Optional.of(existing));
        when(userService.saveUser(existing)).thenReturn(existing);

        when(jwtUtil.generateAccessToken(any(), any(), any(), any())).thenReturn("access123");
        when(jwtUtil.generateRefreshToken(any(), any())).thenReturn("refresh123");

        // --- Act ---
        ResponseEntity<Void> result = controller.handleAzureCallback(authentication, response);

        // --- Assert ---
        assertEquals(200, result.getStatusCode().value());
        verify(response, atLeast(2)).addHeader(eq(HttpHeaders.SET_COOKIE), anyString());
        verify(userService, times(1)).saveUser(existing);
        verify(jwtUtil).generateAccessToken(eq("test@example.com"), eq("U1"), eq("John"), eq("[\"employee\"]"));
        verify(jwtUtil).generateRefreshToken(eq("test@example.com"), eq("U1"));
    }

    @Test
    void testHandleAzureCallback_UserAlreadyExists_WithAzureOidPresent() {
        when(authentication.getPrincipal()).thenReturn(principal);
        when(principal.getEmail()).thenReturn("hasoid@example.com");
        when(principal.getClaim("oid")).thenReturn("AZURE-XYZ");
        when(principal.getGivenName()).thenReturn("Jane");
        when(principal.getFamilyName()).thenReturn("Smith");

        User existing = new User();
        existing.setId("U2");
        existing.setEmail("hasoid@example.com");
        existing.setFirstName("Jane");
        existing.setLastName("Smith");
        existing.setAzureOid("AZURE-XYZ");
        existing.setRole("[\"employee\"]");

        when(userService.findByEmail("hasoid@example.com")).thenReturn(Optional.of(existing));
        when(jwtUtil.generateAccessToken(any(), any(), any(), any())).thenReturn("accessToken");
        when(jwtUtil.generateRefreshToken(any(), any())).thenReturn("refreshToken");

        ResponseEntity<Void> result = controller.handleAzureCallback(authentication, response);

        assertEquals(200, result.getStatusCode().value());
        verify(userService, never()).saveUser(existing); // no re-save, since azureOid present
        verify(response, atLeast(2)).addHeader(eq(HttpHeaders.SET_COOKIE), anyString());
    }

    @Test
    void testHandleAzureCallback_UserNotFound_CreatesNewUser() {
        when(authentication.getPrincipal()).thenReturn(principal);
        when(principal.getEmail()).thenReturn("newuser@example.com");
        when(principal.getClaim("oid")).thenReturn("OID-NEW");
        when(principal.getGivenName()).thenReturn("Alice");
        when(principal.getFamilyName()).thenReturn("Brown");

        when(userService.findByEmail("newuser@example.com")).thenReturn(Optional.empty());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        when(userService.saveUser(any())).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId("ID-NEW");
            return u;
        });

        when(jwtUtil.generateAccessToken(any(), any(), any(), any())).thenReturn("accessTokenNEW");
        when(jwtUtil.generateRefreshToken(any(), any())).thenReturn("refreshTokenNEW");

        ResponseEntity<Void> result = controller.handleAzureCallback(authentication, response);

        assertEquals(200, result.getStatusCode().value());
        verify(userService).saveUser(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertEquals("newuser@example.com", saved.getEmail());
        assertEquals("Alice", saved.getFirstName());
        assertEquals("Brown", saved.getLastName());
        assertEquals("OID-NEW", saved.getAzureOid());
        verify(response, atLeast(2)).addHeader(eq(HttpHeaders.SET_COOKIE), anyString());
    }
}
