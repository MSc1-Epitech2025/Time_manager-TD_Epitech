package com.example.time_manager.dto.absence;

import java.time.LocalDate;
import java.util.Map;
import com.example.time_manager.model.absence.AbsencePeriod;
import com.example.time_manager.model.absence.AbsenceType;
import jakarta.validation.constraints.NotNull;

public class AbsenceCreateRequest {
  @NotNull public LocalDate startDate;
  @NotNull public LocalDate endDate;
  @NotNull public AbsenceType type;
  public String reason;
  public String supportingDocumentUrl;
  public Map<String, AbsencePeriod> periodByDate;
}
