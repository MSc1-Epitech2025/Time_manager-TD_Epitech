package com.example.time_manager.services.absence;

import com.example.time_manager.dto.absence.AbsenceStatusUpdateRequest;
import com.example.time_manager.model.User;
import com.example.time_manager.model.absence.*;
import com.example.time_manager.repository.*;
import com.example.time_manager.service.AbsenceService;
import com.example.time_manager.service.leave.LeaveAccountingBridge;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.time_manager.service.AutoReportService;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AbsenceServiceDeleteAndStatusTest {

    AbsenceRepository absenceRepo = mock(AbsenceRepository.class);
    AbsenceDayRepository dayRepo = mock(AbsenceDayRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    TeamMemberRepository teamMemberRepo = mock(TeamMemberRepository.class);
    LeaveAccountingBridge bridge = mock(LeaveAccountingBridge.class);
    AutoReportService autoReportService = mock(AutoReportService.class);

    AbsenceService service =
            new AbsenceService(
                    absenceRepo,
                    dayRepo,
                    userRepo,
                    teamMemberRepo,
                    bridge,
                    autoReportService
            );

    @Test
    void setStatus_shouldApprove_andDebit() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setEmail("admin@test.com");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(1L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);
        when(absenceRepo.findById(1L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenReturn(a);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(1L)).thenReturn(List.of());

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(AbsenceStatus.APPROVED);

        var result = service.setStatus("admin@test.com", 1L, req);
        verify(bridge).ensureDebitForApprovedAbsence(a);
        assertThat(result.getStatus()).isEqualTo(AbsenceStatus.APPROVED);
    }

    @Test
    void setStatus_shouldReject_andRemoveDebit() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setEmail("admin@test.com");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(2L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);
        when(absenceRepo.findById(2L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenReturn(a);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(2L)).thenReturn(List.of());

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(AbsenceStatus.REJECTED);

        var result = service.setStatus("admin@test.com", 2L, req);
        verify(bridge).removeDebitForAbsence(2L);
        assertThat(result.getStatus()).isEqualTo(AbsenceStatus.REJECTED);
    }

    @Test
    void setStatus_shouldThrow_ifPendingStatusGiven() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setEmail("admin@test.com");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(3L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);
        when(absenceRepo.findById(3L)).thenReturn(Optional.of(a));

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(AbsenceStatus.PENDING);

        assertThatThrownBy(() -> service.setStatus("admin@test.com", 3L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Status must be APPROVED or REJECTED");
    }

    @Test
    void deleteVisibleTo_shouldAllowAdmin() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setEmail("admin@test.com");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(5L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.APPROVED);
        when(absenceRepo.findById(5L)).thenReturn(Optional.of(a));

        service.deleteVisibleTo("admin@test.com", 5L);

        verify(bridge).removeDebitForAbsence(5L);
        verify(dayRepo).deleteByAbsenceId(5L);
        verify(absenceRepo).deleteById(5L);
    }

    @Test
    void deleteVisibleTo_shouldThrow_ifNotOwnerOrAdmin() {
        var auth = new TestingAuthenticationToken("E1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User emp = new User();
        emp.setId("E1");
        emp.setEmail("emp@test.com");
        emp.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("emp@test.com")).thenReturn(Optional.of(emp));

        Absence a = new Absence();
        a.setId(9L);
        a.setUserId("U_OTHER");
        a.setStatus(AbsenceStatus.PENDING);
        when(absenceRepo.findById(9L)).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> service.deleteVisibleTo("emp@test.com", 9L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void deleteVisibleTo_shouldThrow_ifUserNotFound() {
        when(userRepo.findByEmail("ghost@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteVisibleTo("ghost@test.com", 1L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void deleteVisibleTo_shouldThrow_ifOwnerButNotPending() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User owner = new User();
        owner.setId("U1");
        owner.setRole("[\"EMPLOYEE\"]");

        when(userRepo.findByEmail("owner@test.com")).thenReturn(Optional.of(owner));

        Absence a = new Absence();
        a.setId(88L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.APPROVED);

        when(absenceRepo.findById(88L)).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> service.deleteVisibleTo("owner@test.com", 88L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("owner can delete only while PENDING");
    }

    @Test
    void setStatus_shouldHandleDefaultCase() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setEmail("admin@test.com");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(77L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);

        when(absenceRepo.findById(77L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenReturn(a);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(77L)).thenReturn(List.of());

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(AbsenceStatus.REJECTED);

        var res = service.setStatus("admin@test.com", 77L, req);

        assertThat(res.getStatus()).isEqualTo(AbsenceStatus.REJECTED);
    }
}
