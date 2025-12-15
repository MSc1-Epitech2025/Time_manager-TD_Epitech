package com.example.time_manager.dto.report;

import java.time.Instant;

public class ReportResponse {

  private Long id;

  private String authorId;
  private String authorEmail;

  private String targetUserId;
  private String targetEmail;

  // nouveau
  private String subjectUserId;
  private String subjectEmail;

  // nouveau
  private String type;
  private String severity;

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

  public String getSubjectUserId() { return subjectUserId; }
  public void setSubjectUserId(String subjectUserId) { this.subjectUserId = subjectUserId; }

  public String getSubjectEmail() { return subjectEmail; }
  public void setSubjectEmail(String subjectEmail) { this.subjectEmail = subjectEmail; }

  public String getType() { return type; }
  public void setType(String type) { this.type = type; }

  public String getSeverity() { return severity; }
  public void setSeverity(String severity) { this.severity = severity; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getBody() { return body; }
  public void setBody(String body) { this.body = body; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
