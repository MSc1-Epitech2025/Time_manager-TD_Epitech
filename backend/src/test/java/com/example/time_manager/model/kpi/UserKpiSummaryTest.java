package com.example.time_manager.model.kpi;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserKpiSummaryTest {

    @Test
    void testSettersAndGetters() {
        UserKpiSummary summary = new UserKpiSummary();

        UUID userId = UUID.randomUUID();
        LocalDate start = LocalDate.of(2025, 1, 1);
        LocalDate end = LocalDate.of(2025, 1, 31);

        PunctualityStats punctuality = new PunctualityStats(
                new BigDecimal("12.3"),
                new BigDecimal("4.5")
        );

        AbsenceBreakdown absenceBreakdown = new AbsenceBreakdown("SICK", new BigDecimal("2.0"));
        LeaveBalance leaveBalance = new LeaveBalance(
                "PAID",
                new BigDecimal("10"),
                new BigDecimal("2"),
                new BigDecimal("1"),
                new BigDecimal("0"),
                new BigDecimal("0"),
                new BigDecimal("11")
        );

        summary.setUserId(userId);
        summary.setFullName("John Doe");
        summary.setPresenceRate(new BigDecimal("95.5"));
        summary.setAvgHoursPerDay(new BigDecimal("7.8"));
        summary.setOvertimeHours(new BigDecimal("2.3"));
        summary.setPunctuality(punctuality);
        summary.setAbsenceDays(new BigDecimal("1.5"));
        summary.setAbsenceByType(List.of(absenceBreakdown));
        summary.setLeaveBalances(List.of(leaveBalance));
        summary.setReportsAuthored(3);
        summary.setReportsReceived(5);
        summary.setPeriodStart(start);
        summary.setPeriodEnd(end);

        assertThat(summary.getUserId()).isEqualTo(userId);
        assertThat(summary.getFullName()).isEqualTo("John Doe");
        assertThat(summary.getPresenceRate()).isEqualByComparingTo("95.5");
        assertThat(summary.getAvgHoursPerDay()).isEqualByComparingTo("7.8");
        assertThat(summary.getOvertimeHours()).isEqualByComparingTo("2.3");
        assertThat(summary.getPunctuality()).isEqualTo(punctuality);
        assertThat(summary.getAbsenceDays()).isEqualByComparingTo("1.5");
        assertThat(summary.getAbsenceByType()).hasSize(1);
        assertThat(summary.getAbsenceByType().get(0).getType()).isEqualTo("SICK");
        assertThat(summary.getLeaveBalances()).hasSize(1);
        assertThat(summary.getLeaveBalances().get(0).getLeaveType()).isEqualTo("PAID");
        assertThat(summary.getReportsAuthored()).isEqualTo(3);
        assertThat(summary.getReportsReceived()).isEqualTo(5);
        assertThat(summary.getPeriodStart()).isEqualTo(start);
        assertThat(summary.getPeriodEnd()).isEqualTo(end);
    }

    @Test
    void testModifyValues() {
        UserKpiSummary summary = new UserKpiSummary();

        UUID userId = UUID.randomUUID();
        summary.setUserId(userId);
        summary.setFullName("Jane Smith");
        summary.setPresenceRate(BigDecimal.ZERO);
        summary.setAvgHoursPerDay(new BigDecimal("6.5"));
        summary.setOvertimeHours(BigDecimal.ONE);
        summary.setReportsAuthored(0);
        summary.setReportsReceived(0);

        assertThat(summary.getUserId()).isEqualTo(userId);
        assertThat(summary.getFullName()).isEqualTo("Jane Smith");
        assertThat(summary.getPresenceRate()).isEqualByComparingTo("0");
        assertThat(summary.getAvgHoursPerDay()).isEqualByComparingTo("6.5");
        assertThat(summary.getOvertimeHours()).isEqualByComparingTo("1");
        assertThat(summary.getReportsAuthored()).isZero();
        assertThat(summary.getReportsReceived()).isZero();
    }
}
