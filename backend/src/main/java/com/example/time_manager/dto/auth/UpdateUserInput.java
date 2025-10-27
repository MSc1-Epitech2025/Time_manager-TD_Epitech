package com.example.time_manager.dto.auth;

public record UpdateUserInput(
    String id,
    String firstName,
    String lastName,
    String email,
    String phone,
    String role,
    String poste,
    String avatarUrl,
    String password
) {}
