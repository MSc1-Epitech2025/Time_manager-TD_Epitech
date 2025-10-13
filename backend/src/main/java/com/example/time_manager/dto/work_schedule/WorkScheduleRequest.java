package com.example.time_manager.dto.work_schedule;

import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class WorkScheduleRequest {
  @NotNull public WorkDay dayOfWeek;     // MON..SUN
  @NotNull public WorkPeriod period;     // AM or PM

  // HH:mm or HH:mm:ss accepted (normalize server-side)
  @NotNull
  @Pattern(regexp = "^\\d{2}:\\d{2}(:\\d{2})?$", message = "startTime must be HH:mm or HH:mm:ss")
  public String startTime;

  @NotNull
  @Pattern(regexp = "^\\d{2}:\\d{2}(:\\d{2})?$", message = "endTime must be HH:mm or HH:mm:ss")
  public String endTime;
}
