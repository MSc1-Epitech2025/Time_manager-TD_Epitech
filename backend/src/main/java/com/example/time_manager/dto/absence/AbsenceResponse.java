package com.example.time_manager.dto.absence;

import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.model.absence.AbsenceType;
import java.time.Instant;
import java.util.List;


public class AbsenceResponse {
  public Long id; public String userId;
  public String startDate; public String endDate;
  public AbsenceType type; public String reason; public String supportingDocumentUrl;
  public AbsenceStatus status; public String approvedBy; public Instant approvedAt;
  public Instant createdAt; public Instant updatedAt;
  public List<AbsenceDayResponse> days;
}
