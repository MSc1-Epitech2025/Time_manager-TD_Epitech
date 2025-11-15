package com.example.time_manager.services.absence;

import com.example.time_manager.dto.absence.AbsenceUpdateRequest;
import com.example.time_manager.model.User;
import com.example.time_manager.model.absence.*;
import com.example.time_manager.repository.*;
import com.example.time_manager.service.AbsenceService;
import com.example.time_manager.service.leave.LeaveAccountingBridge;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AbsenceServiceUpdateTest {

    AbsenceRepository absenceRepo = mock(AbsenceRepository.class);
    AbsenceDayRepository dayRepo = mock(AbsenceDayRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    TeamMemberRepository teamMemberRepo = mock(TeamMemberRepository.class);
    LeaveAccountingBridge bridge = mock(LeaveAccountingBridge.class);

    AbsenceService service = new AbsenceService(absenceRepo, dayRepo, userRepo, teamMemberRepo, bridge);

    @Test
    void updateVisibleTo_shouldAllowAdmin_andTriggerDebitWhenApproved() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(1L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.APPROVED);
        a.setStartDate(LocalDate.of(2025,1,1));
        a.setEndDate(LocalDate.of(2025,1,2));

        when(absenceRepo.findById(1L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenReturn(a);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(1L)).thenReturn(List.of());

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        req.setReason("updated");

        var result = service.updateVisibleTo("admin@test.com", 1L, req);

        verify(bridge).ensureDebitForApprovedAbsence(a);
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void updateVisibleTo_shouldThrow_ifUserNotFound() {
        when(userRepo.findByEmail("ghost@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateVisibleTo("ghost@test.com", 1L, new AbsenceUpdateRequest()))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void updateVisibleTo_shouldThrow_ifAbsenceNotFound() {
        User u = new User();
        u.setId("U1");
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));
        when(absenceRepo.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateVisibleTo("u@test.com", 1L, new AbsenceUpdateRequest()))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void updateVisibleTo_shouldAllowOwnerWhilePending() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User u = new User();
        u.setId("U1");
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));

        Absence a = new Absence();
        a.setId(10L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);
        a.setStartDate(LocalDate.of(2025,1,1));
        a.setEndDate(LocalDate.of(2025,1,2));

        when(absenceRepo.findById(10L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenReturn(a);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(10L)).thenReturn(List.of());

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        req.setReason("change");
        var result = service.updateVisibleTo("u@test.com", 10L, req);
        assertThat(result.getId()).isEqualTo(10L);
    }

    @Test
    void updateVisibleTo_shouldThrow_ifOwnerButNotPending() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User u = new User();
        u.setId("U1");
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));

        Absence a = new Absence();
        a.setId(11L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.APPROVED);

        when(absenceRepo.findById(11L)).thenReturn(Optional.of(a));

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        assertThatThrownBy(() -> service.updateVisibleTo("u@test.com", 11L, req))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("owner can edit only while PENDING");
    }

    @Test
    void updateVisibleTo_shouldRegenerateDays_whenPeriodUpdated() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(50L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);
        a.setStartDate(LocalDate.of(2025,2,1));
        a.setEndDate(LocalDate.of(2025,2,3));

        when(absenceRepo.findById(50L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenReturn(a);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(50L)).thenReturn(List.of());

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        Map<LocalDate, AbsencePeriod> map = new HashMap<>();
        map.put(LocalDate.of(2025,2,1), AbsencePeriod.AM);
        req.setPeriodByDate(map);

        var res = service.updateVisibleTo("admin@test.com", 50L, req);
        verify(dayRepo).deleteByAbsenceId(50L);
        verify(dayRepo).saveAll(anyList());
        assertThat(res.getId()).isEqualTo(50L);
    }

    @Test
    void updateVisibleTo_shouldUpdateAllNonNullFields() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(99L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);
        a.setStartDate(LocalDate.of(2025, 1, 1));
        a.setEndDate(LocalDate.of(2025, 1, 2));

        when(absenceRepo.findById(99L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenReturn(a);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(99L))
                .thenReturn(List.of());

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        req.setStartDate(LocalDate.of(2030, 1, 1));
        req.setEndDate(LocalDate.of(2030, 1, 2));
        req.setType(AbsenceType.SICK);
        req.setReason("new reason");
        req.setSupportingDocumentUrl("newUrl");

        var res = service.updateVisibleTo("admin@test.com", 99L, req);

        assertThat(res.getStartDate()).isEqualTo(LocalDate.of(2030,1,1));
        assertThat(res.getEndDate()).isEqualTo(LocalDate.of(2030,1,2));
        assertThat(res.getType()).isEqualTo(AbsenceType.SICK);
        assertThat(res.getReason()).isEqualTo("new reason");
        assertThat(res.getSupportingDocumentUrl()).isEqualTo("newUrl");
    }
}
