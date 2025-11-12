package com.example.time_manager.model.kpi;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class TeamKpiSummaryTest {

    @Test
    void testSettersAndGetters() {
        TeamKpiSummary summary = new TeamKpiSummary();

        LocalDate start = LocalDate.of(2025, 1, 1);
        LocalDate end = LocalDate.of(2025, 1, 31);

        summary.setTeamId(42);
        summary.setTeamName("Dev Team");
        summary.setHeadcount(10);
        summary.setPresenceRate(new BigDecimal("95.5"));
        summary.setAvgHoursPerDay(new BigDecimal("7.8"));
        summary.setAbsenceRate(new BigDecimal("4.5"));
        summary.setReportsAuthored(8);
        summary.setPeriodStart(start);
        summary.setPeriodEnd(end);

        assertThat(summary.getTeamId()).isEqualTo(42);
        assertThat(summary.getTeamName()).isEqualTo("Dev Team");
        assertThat(summary.getHeadcount()).isEqualTo(10);
        assertThat(summary.getPresenceRate()).isEqualByComparingTo("95.5");
        assertThat(summary.getAvgHoursPerDay()).isEqualByComparingTo("7.8");
        assertThat(summary.getAbsenceRate()).isEqualByComparingTo("4.5");
        assertThat(summary.getReportsAuthored()).isEqualTo(8);
        assertThat(summary.getPeriodStart()).isEqualTo(start);
        assertThat(summary.getPeriodEnd()).isEqualTo(end);
    }

    @Test
    void testModifyValues() {
        TeamKpiSummary summary = new TeamKpiSummary();

        summary.setTeamId(1);
        summary.setTeamName("QA Team");
        summary.setHeadcount(5);
        summary.setPresenceRate(new BigDecimal("88.0"));
        summary.setAvgHoursPerDay(new BigDecimal("6.9"));
        summary.setAbsenceRate(new BigDecimal("12.0"));
        summary.setReportsAuthored(3);
        summary.setPeriodStart(LocalDate.of(2025, 2, 1));
        summary.setPeriodEnd(LocalDate.of(2025, 2, 28));

        assertThat(summary.getTeamId()).isEqualTo(1);
        assertThat(summary.getTeamName()).isEqualTo("QA Team");
        assertThat(summary.getHeadcount()).isEqualTo(5);
        assertThat(summary.getPresenceRate()).isEqualByComparingTo("88.0");
        assertThat(summary.getAvgHoursPerDay()).isEqualByComparingTo("6.9");
        assertThat(summary.getAbsenceRate()).isEqualByComparingTo("12.0");
        assertThat(summary.getReportsAuthored()).isEqualTo(3);
        assertThat(summary.getPeriodStart()).isEqualTo(LocalDate.of(2025, 2, 1));
        assertThat(summary.getPeriodEnd()).isEqualTo(LocalDate.of(2025, 2, 28));
    }
}
