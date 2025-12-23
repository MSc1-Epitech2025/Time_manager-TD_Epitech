package com.example.time_manager.services;
import com.example.time_manager.model.PasswordResetToken;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.PasswordResetTokenRepository;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.auth.PasswordResetService;
import com.example.time_manager.service.mail.MailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private PasswordResetTokenRepository tokenRepo;

    @Mock
    private PasswordEncoder encoder;

    @Mock
    private MailService mailService;

    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        service = new PasswordResetService(userRepo, tokenRepo, encoder, mailService);
    }

    @Test
    void sendSetPasswordEmailFor_withoutTempPassword() {
        User user = new User();
        user.setId("user-123");
        user.setEmail("test@example.com");
        user.setFirstName("John");

        service.sendSetPasswordEmailFor(user);

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepo).save(tokenCaptor.capture());

        PasswordResetToken savedToken = tokenCaptor.getValue();
        assertNotNull(savedToken.getToken());
        assertEquals("user-123", savedToken.getUserId());
        assertNotNull(savedToken.getExpiresAt());

        verify(mailService).sendResetPasswordEmail(
                eq("test@example.com"),
                eq("John"),
                contains("/reset-password?token="),
                eq(30L),
                isNull()
        );
    }

    @Test
    void sendSetPasswordEmailFor_withTempPassword() {
        User user = new User();
        user.setId("user-123");
        user.setEmail("test@example.com");
        user.setFirstName("John");

        service.sendSetPasswordEmailFor(user, "tempPass123");

        verify(tokenRepo).save(any(PasswordResetToken.class));
        verify(mailService).sendResetPasswordEmail(
                eq("test@example.com"),
                eq("John"),
                contains("/reset-password?token="),
                eq(30L),
                eq("tempPass123")
        );
    }

    @Test
    void requestResetByEmail_userExists() {
        User user = new User();
        user.setId("user-123");
        user.setEmail("test@example.com");
        user.setFirstName("John");

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        service.requestResetByEmail("test@example.com");

        verify(tokenRepo).save(any(PasswordResetToken.class));
        verify(mailService).sendResetPasswordEmail(anyString(), anyString(), anyString(), anyLong(), isNull());
    }

    @Test
    void requestResetByEmail_userNotExists() {
        when(userRepo.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        service.requestResetByEmail("unknown@example.com");

        verify(tokenRepo, never()).save(any());
        verify(mailService, never()).sendResetPasswordEmail(anyString(), anyString(), anyString(), anyLong(), any());
    }

    @Test
    void requestResetWithTempPassword_success() {
        User user = new User();
        user.setId("user-123");
        user.setEmail("test@example.com");
        user.setFirstName("John");

        when(userRepo.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(encoder.encode(anyString())).thenReturn("encodedPassword");

        service.requestResetWithTempPassword("test@example.com");

        verify(encoder).encode(anyString());
        verify(userRepo).save(user);
        assertTrue(user.isFirstConnection());
        verify(tokenRepo).save(any(PasswordResetToken.class));
        verify(mailService).sendResetPasswordEmail(anyString(), anyString(), anyString(), anyLong(), anyString());
    }

    @Test
    void requestResetWithTempPassword_userNotFound() {
        when(userRepo.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.requestResetWithTempPassword("unknown@example.com"));

        assertEquals("No account found with this email address", ex.getMessage());
    }

    @Test
    void resetPassword_success() {
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("valid-token");
        token.setUserId("user-123");
        token.setExpiresAt(Instant.now().plusSeconds(3600));
        token.setUsed(false);

        User user = new User();
        user.setId("user-123");

        when(tokenRepo.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(userRepo.findById("user-123")).thenReturn(Optional.of(user));
        when(encoder.encode("newPassword")).thenReturn("encodedNewPassword");

        service.resetPassword("valid-token", "newPassword");

        assertEquals("encodedNewPassword", user.getPassword());
        verify(userRepo).save(user);
        assertTrue(token.isUsed());
        verify(tokenRepo).save(token);
    }

    @Test
    void resetPassword_invalidToken() {
        when(tokenRepo.findByToken("invalid-token")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.resetPassword("invalid-token", "newPassword"));

        assertEquals("Invalid token", ex.getMessage());
    }

    @Test
    void resetPassword_tokenAlreadyUsed() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUsed(true);

        when(tokenRepo.findByToken("used-token")).thenReturn(Optional.of(token));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.resetPassword("used-token", "newPassword"));

        assertEquals("Token already used", ex.getMessage());
    }

    @Test
    void resetPassword_tokenExpired() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUsed(false);
        token.setExpiresAt(Instant.now().minusSeconds(3600));

        when(tokenRepo.findByToken("expired-token")).thenReturn(Optional.of(token));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.resetPassword("expired-token", "newPassword"));

        assertEquals("Token expired", ex.getMessage());
    }

    @Test
    void resetPassword_userNotFound() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUsed(false);
        token.setUserId("user-123");
        token.setExpiresAt(Instant.now().plusSeconds(3600));

        when(tokenRepo.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(userRepo.findById("user-123")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.resetPassword("valid-token", "newPassword"));

        assertEquals("User not found", ex.getMessage());
    }
}
