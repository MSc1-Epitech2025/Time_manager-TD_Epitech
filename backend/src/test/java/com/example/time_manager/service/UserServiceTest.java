package com.example.time_manager.service;

import com.example.time_manager.model.User;
import com.example.time_manager.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserServiceTestTest {

    @Test
    void findByIdOrThrow_shouldReturnUser_whenExists() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, null);

        User user = new User();
        user.setId("123");
        when(userRepository.findById("123")).thenReturn(Optional.of(user));

        User result = userService.findByIdOrThrow("123");

        assertThat(result).isEqualTo(user);
    }

    @Test
    void findByIdOrThrow_shouldThrow_whenNotExists() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, null);

        when(userRepository.findById("999")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findByIdOrThrow("999"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }
}