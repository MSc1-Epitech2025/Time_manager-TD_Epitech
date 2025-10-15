package com.example.time_manager.dto.team;

import jakarta.validation.constraints.NotBlank;

public class MemberChangeDto {

    @NotBlank
    private String userId;

    public MemberChangeDto() {}
    public MemberChangeDto(String userId) { this.userId = userId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
