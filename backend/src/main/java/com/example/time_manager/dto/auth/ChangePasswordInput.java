package com.example.time_manager.dto.auth;

public record ChangePasswordInput(
        String currentPassword,
        String newPassword
) {}
