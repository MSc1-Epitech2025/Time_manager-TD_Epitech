package com.example.time_manager.dto.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReportCreateRequest {

  @NotBlank
  private String targetUserId;

  private String subjectUserId;

  @NotBlank
  @Size(max = 255)
  private String title;

  private String body;

  public ReportCreateRequest() {}

  public String getTargetUserId() { return targetUserId; }
  public void setTargetUserId(String targetUserId) { this.targetUserId = targetUserId; }

  public String getSubjectUserId() { return subjectUserId; }
  public void setSubjectUserId(String subjectUserId) { this.subjectUserId = subjectUserId; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getBody() { return body; }
  public void setBody(String body) { this.body = body; }
}
