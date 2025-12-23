package com.example.time_manager.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class PasswordGeneratorTest {

    @Test
    void generate_shouldReturnPasswordOfRequestedLength() {
        String password = PasswordGenerator.generate(10);

        assertThat(password).hasSize(10);
    }

    @Test
    void generate_shouldReturnLongerPassword() {
        String password = PasswordGenerator.generate(20);

        assertThat(password).hasSize(20);
    }

    @Test
    void generate_shouldThrow_whenLengthLessThan10() {
        assertThatThrownBy(() -> PasswordGenerator.generate(9))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("length must be >= 10");
    }

    @Test
    void generate_shouldThrow_whenLengthIsZero() {
        assertThatThrownBy(() -> PasswordGenerator.generate(0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("length must be >= 10");
    }

    @Test
    void generate_shouldThrow_whenLengthIsNegative() {
        assertThatThrownBy(() -> PasswordGenerator.generate(-5))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("length must be >= 10");
    }

    @Test
    void generate_shouldReturnDifferentPasswords() {
        String password1 = PasswordGenerator.generate(10);
        String password2 = PasswordGenerator.generate(10);

        assertThat(password1).isNotEqualTo(password2);
    }
}
