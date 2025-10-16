package com.example.time_manager.dto.absence;

import com.example.time_manager.model.absence.AbsenceStatus;

public class AbsenceStatusUpdateRequest {
  private AbsenceStatus status;

  public AbsenceStatusUpdateRequest() {}

  public AbsenceStatus getStatus() { return status; }
  public void setStatus(AbsenceStatus status) { this.status = status; }
}
