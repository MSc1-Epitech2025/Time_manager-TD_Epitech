package com.example.time_manager.dto.kpi;

public record KpiTeam(
    Long teamId,
    DateRange range,
    int memberCount,
    AttendanceKpi attendance,
    TimeKpi time,
    PunctualityKpi punctuality
) {}
