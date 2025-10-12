package com.example.time_manager.dto.report;

import jakarta.validation.constraints.Size;

public class ReportUpdateRequest {
  @Size(max = 255)
  public String title;
  public String body;

  public String targetUserId;
}
