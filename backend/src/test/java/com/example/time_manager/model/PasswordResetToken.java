package com.example.time_manager.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordResetTokenTest {

    @Test
    void testGettersAndSetters() {
        PasswordResetToken token = new PasswordResetToken();

        Long id = 1L;
        String tokenValue = "abc123xyz";
        String userId = "user-456";
        Instant expiresAt = Instant.now().plusSeconds(3600);
        boolean used = true;

        token.setId(id);
        token.setToken(tokenValue);
        token.setUserId(userId);
        token.setExpiresAt(expiresAt);
        token.setUsed(used);

        assertThat(token.getId()).isEqualTo(id);
        assertThat(token.getToken()).isEqualTo(tokenValue);
        assertThat(token.getUserId()).isEqualTo(userId);
        assertThat(token.getExpiresAt()).isEqualTo(expiresAt);
        assertThat(token.isUsed()).isTrue();
    }

    @Test
    void testDefaultValues() {
        PasswordResetToken token = new PasswordResetToken();

        assertThat(token.getId()).isNull();
        assertThat(token.getToken()).isNull();
        assertThat(token.getUserId()).isNull();
        assertThat(token.getExpiresAt()).isNull();
        assertThat(token.isUsed()).isFalse();
    }

    @Test
    void testUsedFalse() {
        PasswordResetToken token = new PasswordResetToken();
        token.setUsed(false);

        assertThat(token.isUsed()).isFalse();
    }
}
