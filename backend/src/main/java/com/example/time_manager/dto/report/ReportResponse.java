package com.example.time_manager.dto.report;

import java.time.Instant;

public class ReportResponse {

  private Long id;

  private String authorId;
  private String authorEmail;

  private String targetUserId;
  private String targetEmail;

  private String title;
  private String body;

  private Instant createdAt;
  private Instant updatedAt;

  public ReportResponse() {}

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getAuthorId() { return authorId; }
  public void setAuthorId(String authorId) { this.authorId = authorId; }

  public String getAuthorEmail() { return authorEmail; }
  public void setAuthorEmail(String authorEmail) { this.authorEmail = authorEmail; }

  public String getTargetUserId() { return targetUserId; }
  public void setTargetUserId(String targetUserId) { this.targetUserId = targetUserId; }

  public String getTargetEmail() { return targetEmail; }
  public void setTargetEmail(String targetEmail) { this.targetEmail = targetEmail; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getBody() { return body; }
  public void setBody(String body) { this.body = body; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
