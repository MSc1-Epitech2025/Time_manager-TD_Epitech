package com.example.time_manager.dto.report;

import java.time.Instant;

public class ReportResponse {
  public Long id;
  public String managerId;
  public String managerEmail;
  public String title;
  public String body;
  public Instant createdAt;
}
