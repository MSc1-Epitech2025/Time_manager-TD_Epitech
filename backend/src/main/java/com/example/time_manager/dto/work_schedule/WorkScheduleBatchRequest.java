package com.example.time_manager.dto.work_schedule;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class WorkScheduleBatchRequest {
  /** When true, replace the entire weekly schedule for that user with the provided entries */
  public boolean replaceAll = true;

  @NotEmpty
  public List<@Valid WorkScheduleRequest> entries;
}
