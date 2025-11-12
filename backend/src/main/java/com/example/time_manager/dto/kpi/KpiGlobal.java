package com.example.time_manager.dto.kpi;

public record KpiGlobal(
    DateRange range,
    int totalUsers,
    int totalTeams,
    AttendanceKpi attendance,
    TimeKpi time,
    PunctualityKpi punctuality
) {}
