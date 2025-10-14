package com.example.time_manager.dto.report;
public class ReportUpdateRequest {
  private String title;
  private String body;
  private String targetUserId;

  public ReportUpdateRequest() {}

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getBody() { return body; }
  public void setBody(String body) { this.body = body; }

  public String getTargetUserId() { return targetUserId; }
  public void setTargetUserId(String targetUserId) { this.targetUserId = targetUserId; }
}
