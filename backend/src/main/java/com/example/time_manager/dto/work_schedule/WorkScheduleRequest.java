package com.example.time_manager.dto.work_schedule;


import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;


public record WorkScheduleRequest(
@NotNull WorkDay dayOfWeek,
@NotNull WorkPeriod period,
@NotBlank String startTime,
@NotBlank String endTime
) {}