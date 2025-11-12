package com.example.time_manager.dto.kpi;

import java.math.BigDecimal;

public record LeaveBalanceItem(
    String leaveTypeCode,
    BigDecimal balance
) {}
