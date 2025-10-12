package com.example.time_manager.dto.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReportCreateRequest {
  public String managerId;
  @NotBlank @Size(max = 255) public String title;
  public String body;
}
