package com.example.time_manager.dto.report;

import jakarta.validation.constraints.Size;

public class ReportUpdateRequest {

  @Size(max = 255)
  private String title;

  private String body;

  public ReportUpdateRequest() {}

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getBody() { return body; }
  public void setBody(String body) { this.body = body; }
}
