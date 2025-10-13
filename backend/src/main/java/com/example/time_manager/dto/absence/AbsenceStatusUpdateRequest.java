package com.example.time_manager.dto.absence;

import com.example.time_manager.model.absence.AbsenceStatus;
import jakarta.validation.constraints.NotNull;

public class AbsenceStatusUpdateRequest {
  @NotNull public AbsenceStatus status;  // APPROVED | REJECTED
}
