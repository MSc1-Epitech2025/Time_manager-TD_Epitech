package com.example.time_manager.dto.absence;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.model.absence.AbsenceType;

public class AbsenceResponse {
  private Long id;
  private String userId;
  private LocalDate startDate;
  private LocalDate endDate;
  private AbsenceType type;
  private String reason;
  private String supportingDocumentUrl;
  private AbsenceStatus status;
  private String approvedBy;
  private LocalDateTime approvedAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private List<AbsenceDayResponse> days;

  public AbsenceResponse() {}

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public LocalDate getStartDate() { return startDate; }
  public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
  public LocalDate getEndDate() { return endDate; }
  public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
  public AbsenceType getType() { return type; }
  public void setType(AbsenceType type) { this.type = type; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public String getSupportingDocumentUrl() { return supportingDocumentUrl; }
  public void setSupportingDocumentUrl(String supportingDocumentUrl) { this.supportingDocumentUrl = supportingDocumentUrl; }
  public AbsenceStatus getStatus() { return status; }
  public void setStatus(AbsenceStatus status) { this.status = status; }
  public String getApprovedBy() { return approvedBy; }
  public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
  public LocalDateTime getApprovedAt() { return approvedAt; }
  public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
  public List<AbsenceDayResponse> getDays() { return days; }
  public void setDays(List<AbsenceDayResponse> days) { this.days = days; }
}
