package com.example.time_manager.controllers;

import com.example.time_manager.graphql.controller.KpiGraphQLController;
import com.example.time_manager.model.User;
import com.example.time_manager.model.kpi.GlobalKpiSummary;
import com.example.time_manager.model.kpi.TeamKpiSummary;
import com.example.time_manager.model.kpi.UserKpiSummary;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.KpiService;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class KpiGraphQLControllerTest {

    KpiService kpiService = mock(KpiService.class);
    UserRepository userRepository = mock(UserRepository.class);
    KpiGraphQLController controller = new KpiGraphQLController(kpiService, userRepository);

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
    void testMyKpi_shouldUseAuthenticatedUserAndCallServiceWithParsedDates() {
        // given
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("john.doe@epitech.eu");

        User user = mock(User.class);
        UUID userId = UUID.randomUUID();
        when(user.getId()).thenReturn(userId.toString());
        when(userRepository.findByEmail("john.doe@epitech.eu")).thenReturn(Optional.of(user));

        LocalDate start = LocalDate.of(2025, 1, 1);
        LocalDate end = LocalDate.of(2025, 1, 31);
        UserKpiSummary expected = new UserKpiSummary();

        when(kpiService.getUser(userId, start, end)).thenReturn(expected);

        // when
        UserKpiSummary result = controller.myKpi("2025-01-01", "2025-01-31", authentication);

        // then
        assertThat(result).isSameAs(expected);
        verify(userRepository).findByEmail("john.doe@epitech.eu");
        verify(kpiService).getUser(userId, start, end);
        verifyNoMoreInteractions(kpiService);
    }

    @Test
    void testMyKpi_withoutAuthentication_shouldThrowAccessDenied() {
        assertThatThrownBy(() ->
                controller.myKpi("2025-01-01", "2025-01-31", null)
        )
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authentication required");

        verifyNoInteractions(kpiService, userRepository);
    }

    @Test
    void testMyKpi_withNotAuthenticatedPrincipal_shouldThrowAccessDenied() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(false);

        assertThatThrownBy(() ->
                controller.myKpi("2025-01-01", "2025-01-31", authentication)
        )
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authentication required");

        verifyNoInteractions(kpiService, userRepository);
    }

    @Test
    void testMyKpi_withInvalidDate_shouldThrowIllegalArgumentException() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("john.doe@epitech.eu");

        User user = mock(User.class);
        UUID userId = UUID.randomUUID();
        when(user.getId()).thenReturn(userId.toString());
        when(userRepository.findByEmail("john.doe@epitech.eu")).thenReturn(Optional.of(user));

        assertThatThrownBy(() ->
                controller.myKpi("not-a-date", "2025-01-31", authentication)
        )
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid date format");

        verify(userRepository).findByEmail("john.doe@epitech.eu");
        verifyNoInteractions(kpiService);
    }

    @Test
    void testConstructorStoresDependencies() {
        assertThat(new KpiGraphQLController(kpiService, userRepository)).isNotNull();
    }
}
