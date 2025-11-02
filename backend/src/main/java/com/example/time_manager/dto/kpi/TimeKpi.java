package com.example.time_manager.dto.kpi;

public record TimeKpi(
    long totalWorkedMinutes,
    long avgWorkedMinutesPerUser,
    long totalOvertimeMinutes
) {}
