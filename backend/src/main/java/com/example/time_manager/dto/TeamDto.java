package com.example.time_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TeamDto {
    public Long id;

    @NotBlank @Size(min=2, max=255)
    public String name;

    @Size(max=10_000)
    public String description;
}
