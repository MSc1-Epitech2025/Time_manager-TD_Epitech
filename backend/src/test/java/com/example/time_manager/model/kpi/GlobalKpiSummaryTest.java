package com.example.time_manager.model.kpi;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalKpiSummaryTest {

    @Test
    void testAllGettersAndSetters() {
        GlobalKpiSummary summary = new GlobalKpiSummary();

        Integer headcount = 42;
        BigDecimal managersShare = new BigDecimal("12.5");
        BigDecimal adminsShare = new BigDecimal("7.3");
        BigDecimal presenceRate = new BigDecimal("98.2");
        BigDecimal avgHoursPerDay = new BigDecimal("7.75");
        BigDecimal totalAbsenceDays = new BigDecimal("5.5");
        BigDecimal absenceRate = new BigDecimal("2.1");
        BigDecimal approvalDelayHours = new BigDecimal("3.2");
        Integer totalReports = 120;
        LocalDate periodStart = LocalDate.of(2025, 1, 1);
        LocalDate periodEnd = LocalDate.of(2025, 12, 31);

        summary.setHeadcount(headcount);
        summary.setManagersShare(managersShare);
        summary.setAdminsShare(adminsShare);
        summary.setPresenceRate(presenceRate);
        summary.setAvgHoursPerDay(avgHoursPerDay);
        summary.setTotalAbsenceDays(totalAbsenceDays);
        summary.setAbsenceRate(absenceRate);
        summary.setApprovalDelayHours(approvalDelayHours);
        summary.setTotalReports(totalReports);
        summary.setPeriodStart(periodStart);
        summary.setPeriodEnd(periodEnd);

        assertThat(summary.getHeadcount()).isEqualTo(headcount);
        assertThat(summary.getManagersShare()).isEqualByComparingTo(managersShare);
        assertThat(summary.getAdminsShare()).isEqualByComparingTo(adminsShare);
        assertThat(summary.getPresenceRate()).isEqualByComparingTo(presenceRate);
        assertThat(summary.getAvgHoursPerDay()).isEqualByComparingTo(avgHoursPerDay);
        assertThat(summary.getTotalAbsenceDays()).isEqualByComparingTo(totalAbsenceDays);
        assertThat(summary.getAbsenceRate()).isEqualByComparingTo(absenceRate);
        assertThat(summary.getApprovalDelayHours()).isEqualByComparingTo(approvalDelayHours);
        assertThat(summary.getTotalReports()).isEqualTo(totalReports);
        assertThat(summary.getPeriodStart()).isEqualTo(periodStart);
        assertThat(summary.getPeriodEnd()).isEqualTo(periodEnd);
    }

    @Test
    void testDefaultConstructorCreatesEmptyObject() {
        GlobalKpiSummary summary = new GlobalKpiSummary();

        assertThat(summary.getHeadcount()).isNull();
        assertThat(summary.getManagersShare()).isNull();
        assertThat(summary.getAdminsShare()).isNull();
        assertThat(summary.getPresenceRate()).isNull();
        assertThat(summary.getAvgHoursPerDay()).isNull();
        assertThat(summary.getTotalAbsenceDays()).isNull();
        assertThat(summary.getAbsenceRate()).isNull();
        assertThat(summary.getApprovalDelayHours()).isNull();
        assertThat(summary.getTotalReports()).isNull();
        assertThat(summary.getPeriodStart()).isNull();
        assertThat(summary.getPeriodEnd()).isNull();
    }
}
