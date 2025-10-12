package com.example.time_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MemberChangeDto {
    @NotBlank @Size(min=36, max=36, message="userId must be a UUID (36 chars)")
    public String userId;
}
