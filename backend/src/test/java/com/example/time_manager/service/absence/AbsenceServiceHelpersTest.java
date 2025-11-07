package com.example.time_manager.service.absence;

import com.example.time_manager.model.User;
import com.example.time_manager.model.absence.*;
import com.example.time_manager.repository.*;
import com.example.time_manager.service.AbsenceService;
import com.example.time_manager.service.leave.LeaveAccountingBridge;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AbsenceServiceHelpersTest {

    AbsenceRepository absenceRepo = mock(AbsenceRepository.class);
    AbsenceDayRepository dayRepo = mock(AbsenceDayRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    TeamMemberRepository teamMemberRepo = mock(TeamMemberRepository.class);
    LeaveAccountingBridge bridge = mock(LeaveAccountingBridge.class);

    AbsenceService service = new AbsenceService(absenceRepo, dayRepo, userRepo, teamMemberRepo, bridge);

    @Test
    void hasRole_shouldReturnTrue_forMatchingRole() throws Exception {
        User u = new User();
        u.setRole("[\"ADMIN\"]");

        Method m = AbsenceService.class.getDeclaredMethod("hasRole", User.class, String.class);
        m.setAccessible(true);
        boolean result = (boolean) m.invoke(service, u, "ADMIN");
        assertThat(result).isTrue();
    }

    @Test
    void hasRole_shouldReturnFalse_forMissingRole() throws Exception {
        User u = new User();
        u.setRole("[\"EMPLOYEE\"]");

        Method m = AbsenceService.class.getDeclaredMethod("hasRole", User.class, String.class);
        m.setAccessible(true);
        boolean result = (boolean) m.invoke(service, u, "ADMIN");
        assertThat(result).isFalse();
    }

    @Test
    void hasRole_shouldHandleNullOrBlank() throws Exception {
        User u = new User();
        u.setRole(null);
        Method m = AbsenceService.class.getDeclaredMethod("hasRole", User.class, String.class);
        m.setAccessible(true);
        boolean result = (boolean) m.invoke(service, u, "ADMIN");
        assertThat(result).isFalse();
    }

    @Test
    void validateDates_shouldThrow_whenNull() throws Exception {
        Method m = AbsenceService.class.getDeclaredMethod("validateDates", LocalDate.class, LocalDate.class);
        m.setAccessible(true);

        Throwable t = catchThrowable(() -> m.invoke(service, null, LocalDate.now()));
        assertThat(t)
                .isInstanceOf(InvocationTargetException.class)
                .hasCauseInstanceOf(IllegalArgumentException.class);
        assertThat(t.getCause().getMessage()).contains("startDate and endDate are required");
    }

    @Test
    void validateDates_shouldThrow_whenStartAfterEnd() throws Exception {
        Method m = AbsenceService.class.getDeclaredMethod("validateDates", LocalDate.class, LocalDate.class);
        m.setAccessible(true);

        Throwable t = catchThrowable(() -> m.invoke(service, LocalDate.of(2025, 2, 2), LocalDate.of(2025, 1, 1)));
        assertThat(t)
                .isInstanceOf(InvocationTargetException.class)
                .hasCauseInstanceOf(IllegalArgumentException.class);
        assertThat(t.getCause().getMessage()).contains("startDate must be on/before endDate");
    }

    @Test
    void validateDates_shouldPass_whenValid() throws Exception {
        Method m = AbsenceService.class.getDeclaredMethod("validateDates", LocalDate.class, LocalDate.class);
        m.setAccessible(true);
        m.invoke(service, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 5));
    }

    @Test
    void currentUserId_shouldReturnSubjectId() throws Exception {
        var auth = new TestingAuthenticationToken("U123", null);
        SecurityContextHolder.getContext().setAuthentication(auth);

        Method m = AbsenceService.class.getDeclaredMethod("currentUserId");
        m.setAccessible(true);
        String id = (String) m.invoke(service);
        assertThat(id).isEqualTo("U123");
    }

    @Test
    void currentUserId_shouldResolveEmailSubject() throws Exception {
        var auth = new TestingAuthenticationToken("user@test.com", null);
        SecurityContextHolder.getContext().setAuthentication(auth);

        User u = new User();
        u.setId("U999");
        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.of(u));

        Method m = AbsenceService.class.getDeclaredMethod("currentUserId");
        m.setAccessible(true);
        String id = (String) m.invoke(service);
        assertThat(id).isEqualTo("U999");
    }

    @Test
    void currentUserId_shouldThrow_whenUnauthenticated() throws Exception {
        SecurityContextHolder.clearContext();
        Method m = AbsenceService.class.getDeclaredMethod("currentUserId");
        m.setAccessible(true);
        assertThatThrownBy(() -> m.invoke(service))
                .hasRootCauseInstanceOf(SecurityException.class)
                .hasRootCauseMessage("Unauthenticated");
    }

    @Test
    void canManagerActOn_shouldReturnTrue_ifSameId() throws Exception {
        User m = new User();
        m.setId("X");
        Method method = AbsenceService.class.getDeclaredMethod("canManagerActOn", User.class, String.class);
        method.setAccessible(true);
        boolean res = (boolean) method.invoke(service, m, "X");
        assertThat(res).isTrue();
    }

    @Test
    void canManagerActOn_shouldReturnFalse_ifNoTeams() throws Exception {
        User m = new User();
        m.setId("M1");
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of());
        Method method = AbsenceService.class.getDeclaredMethod("canManagerActOn", User.class, String.class);
        method.setAccessible(true);
        boolean res = (boolean) method.invoke(service, m, "U2");
        assertThat(res).isFalse();
    }

    @Test
    void canManagerActOn_shouldReturnTrue_ifTeamContainsUser() throws Exception {
        User m = new User();
        m.setId("M1");
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(1L));
        when(teamMemberRepo.existsByTeam_IdAndUser_Id(1L, "U2")).thenReturn(true);
        Method method = AbsenceService.class.getDeclaredMethod("canManagerActOn", User.class, String.class);
        method.setAccessible(true);
        boolean res = (boolean) method.invoke(service, m, "U2");
        assertThat(res).isTrue();
    }

    @Test
    void isAdmin_shouldReturnTrue_forRoleAdmin() throws Exception {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);
        Method m = AbsenceService.class.getDeclaredMethod("isAdmin");
        m.setAccessible(true);
        boolean res = (boolean) m.invoke(service);
        assertThat(res).isTrue();
    }

    @Test
    void isAdmin_shouldReturnFalse_ifNotAdmin() throws Exception {
        var auth = new TestingAuthenticationToken("USER", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);
        Method m = AbsenceService.class.getDeclaredMethod("isAdmin");
        m.setAccessible(true);
        boolean res = (boolean) m.invoke(service);
        assertThat(res).isFalse();
    }

    @Test
    void isAdmin_shouldReturnFalse_ifNoAuth() throws Exception {
        SecurityContextHolder.clearContext();
        Method m = AbsenceService.class.getDeclaredMethod("isAdmin");
        m.setAccessible(true);
        boolean res = (boolean) m.invoke(service);
        assertThat(res).isFalse();
    }

    @Test
    void toDto_shouldMapAllFieldsCorrectly() throws Exception {
        Absence a = new Absence();
        a.setId(10L);
        a.setUserId("U1");
        a.setStartDate(LocalDate.of(2025,1,1));
        a.setEndDate(LocalDate.of(2025,1,2));
        a.setType(AbsenceType.RTT);
        a.setReason("test");
        a.setSupportingDocumentUrl("url");
        a.setStatus(AbsenceStatus.APPROVED);
        a.setApprovedBy("M1");
        a.setApprovedAt(LocalDateTime.now());

        AbsenceDay d = new AbsenceDay();
        d.setId(1L);
        d.setAbsenceDate(LocalDate.of(2025,1,1));
        d.setPeriod(AbsencePeriod.AM);
        d.setStartTime(LocalTime.of(8,0));
        d.setEndTime(LocalTime.of(12,0));

        Method m = AbsenceService.class.getDeclaredMethod("toDto", Absence.class, List.class);
        m.setAccessible(true);
        var res = m.invoke(service, a, List.of(d));

        assertThat(res).isNotNull();
    }
}
