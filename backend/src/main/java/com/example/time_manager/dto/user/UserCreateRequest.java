package com.example.time_manager.dto.user;

import jakarta.validation.constraints.*;

public class UserCreateRequest {
  @NotBlank public String firstName;
  @NotBlank public String lastName;
  @Email @NotBlank public String email;
  @NotBlank @Size(min=8) public String password;
  public String phone;
  public String role;   // JSON string, ex: ["employee"]
  public String poste;
  public String avatarUrl;
}
