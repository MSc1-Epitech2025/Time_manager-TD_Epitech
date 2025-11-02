package com.example.time_manager.dto.kpi;

import java.math.BigDecimal;

public record AttendanceKpi(
    long absenceRequests,
    long approvedAbsences,
    BigDecimal approvedDays
) {}
