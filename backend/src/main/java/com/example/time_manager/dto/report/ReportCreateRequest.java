package com.example.time_manager.dto.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReportCreateRequest {
  @NotBlank
  public String targetUserId;

  @NotBlank
  @Size(max = 255)
  public String title;

  public String body;
}
