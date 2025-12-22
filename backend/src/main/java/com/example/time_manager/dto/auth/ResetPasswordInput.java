package com.example.time_manager.dto.auth;

public record ResetPasswordInput(
        String token,
        String newPassword
) {}
