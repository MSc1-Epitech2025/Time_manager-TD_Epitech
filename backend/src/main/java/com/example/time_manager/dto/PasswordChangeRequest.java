package com.example.time_manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PasswordChangeRequest {
  @NotBlank public String currentPassword;
  @NotBlank @Size(min=8) public String newPassword;
}
