package com.example.time_manager.dto.kpi;

import java.util.List;

public record KpiUser(
    String userId,
    DateRange range,
    AttendanceKpi attendance,
    TimeKpi time,
    PunctualityKpi punctuality,
    List<LeaveBalanceItem> leaveBalances
) {}
