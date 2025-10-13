package com.example.time_manager.graphql.dto;

public record CreateUserInput(
        String firstName,
        String lastName,
        String email,
        String phone,
        String role,
        String poste,
        String password
) {}
