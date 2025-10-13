package com.example.time_manager.dto.report;

import java.time.Instant;

public class ReportResponse {
  public Long id;

  public String authorId;
  public String authorEmail;

  public String targetUserId;
  public String targetEmail;

  public String title;
  public String body;
  public Instant createdAt;
}
