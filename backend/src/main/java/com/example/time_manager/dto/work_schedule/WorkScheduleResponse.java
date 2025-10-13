package com.example.time_manager.dto.work_schedule;

import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;

public class WorkScheduleResponse {
  public Long id;
  public String userId;
  public WorkDay dayOfWeek;
  public WorkPeriod period;
  public String startTime; // HH:mm:ss
  public String endTime;   // HH:mm:ss
}
