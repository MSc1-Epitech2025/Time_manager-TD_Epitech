package com.example.time_manager.controllers;

import com.example.time_manager.graphql.controller.KpiGraphQLController;
import com.example.time_manager.model.kpi.GlobalKpiSummary;
import com.example.time_manager.model.kpi.TeamKpiSummary;
import com.example.time_manager.model.kpi.UserKpiSummary;
import com.example.time_manager.service.KpiService;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class KpiGraphQLControllerTest {

    KpiService kpiService = mock(KpiService.class);
    KpiGraphQLController controller = new KpiGraphQLController(kpiService);

    @Test
    void testGlobalKpi_shouldCallServiceWithParsedDates() {
        GlobalKpiSummary expected = new GlobalKpiSummary();
        LocalDate start = LocalDate.of(2025, 1, 1);
        LocalDate end = LocalDate.of(2025, 1, 31);

        when(kpiService.getGlobal(start, end)).thenReturn(expected);

        GlobalKpiSummary result = controller.globalKpi("2025-01-01", "2025-01-31");

        assertThat(result).isSameAs(expected);
        verify(kpiService).getGlobal(start, end);
        verifyNoMoreInteractions(kpiService);
    }

    @Test
    void testTeamKpi_shouldCallServiceWithParsedDates() {
        TeamKpiSummary expected = new TeamKpiSummary();
        LocalDate start = LocalDate.of(2025, 2, 1);
        LocalDate end = LocalDate.of(2025, 2, 28);

        when(kpiService.getTeam(7, start, end)).thenReturn(expected);

        TeamKpiSummary result = controller.teamKpi(7, "2025-02-01", "2025-02-28");

        assertThat(result).isSameAs(expected);
        verify(kpiService).getTeam(7, start, end);
        verifyNoMoreInteractions(kpiService);
    }

    @Test
    void testUserKpi_shouldCallServiceWithParsedDates() {
        UUID userId = UUID.randomUUID();
        UserKpiSummary expected = new UserKpiSummary();
        LocalDate start = LocalDate.of(2025, 3, 1);
        LocalDate end = LocalDate.of(2025, 3, 31);

        when(kpiService.getUser(userId, start, end)).thenReturn(expected);

        UserKpiSummary result = controller.userKpi(userId, "2025-03-01", "2025-03-31");

        assertThat(result).isSameAs(expected);
        verify(kpiService).getUser(userId, start, end);
        verifyNoMoreInteractions(kpiService);
    }

    @Test
    void testConstructorStoresServiceReference() {
        assertThat(new KpiGraphQLController(kpiService)).isNotNull();
    }
}
