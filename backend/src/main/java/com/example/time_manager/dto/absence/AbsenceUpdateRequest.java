package com.example.time_manager.dto.absence;

import java.time.LocalDate;
import java.util.Map;
import com.example.time_manager.model.absence.AbsencePeriod;
import com.example.time_manager.model.absence.AbsenceType;

public class AbsenceUpdateRequest {
  private LocalDate startDate;
  private LocalDate endDate;
  private AbsenceType type;
  private String reason;
  private String supportingDocumentUrl;
  private Map<LocalDate, AbsencePeriod> periodByDate;

  public AbsenceUpdateRequest() {}

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

  public Map<LocalDate, AbsencePeriod> getPeriodByDate() { return periodByDate; }
  public void setPeriodByDate(Map<LocalDate, AbsencePeriod> periodByDate) { this.periodByDate = periodByDate; }
}
