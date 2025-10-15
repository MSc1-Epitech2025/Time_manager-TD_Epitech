package com.example.time_manager.dto.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TeamDto {
    private Long id;

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 10000)
    private String description;

    public TeamDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
