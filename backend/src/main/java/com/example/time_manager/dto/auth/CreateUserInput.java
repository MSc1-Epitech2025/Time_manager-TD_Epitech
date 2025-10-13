package com.example.time_manager.dto.auth;

public record CreateUserInput(
        String firstName,
        String lastName,
        String email,
        String phone,
        String role,
        String poste,
        String password
) {}
