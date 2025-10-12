package com.example.time_manager.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UserUpdateRequest {
  public String firstName;
  public String lastName;
  @Email public String email;
  public String phone;
  public String role;
  public String poste;
  @Size(min=8, message="Password must be at least 8 chars")
  public String password;
}
