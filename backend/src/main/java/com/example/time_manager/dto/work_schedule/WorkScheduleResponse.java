package com.example.time_manager.dto.work_schedule;


import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;


public record WorkScheduleResponse(
String id,
String userId,
WorkDay dayOfWeek,
WorkPeriod period,
String startTime,
String endTime
) {}