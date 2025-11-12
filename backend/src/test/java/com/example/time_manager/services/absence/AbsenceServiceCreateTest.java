package com.example.time_manager.services.absence;

import com.example.time_manager.dto.absence.AbsenceCreateRequest;
import com.example.time_manager.model.User;
import com.example.time_manager.model.absence.*;
import com.example.time_manager.repository.*;
import com.example.time_manager.service.AbsenceService;
import com.example.time_manager.service.leave.LeaveAccountingBridge;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AbsenceServiceCreateTest {

    AbsenceRepository absenceRepo = mock(AbsenceRepository.class);
    AbsenceDayRepository dayRepo = mock(AbsenceDayRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    TeamMemberRepository teamMemberRepo = mock(TeamMemberRepository.class);
    LeaveAccountingBridge bridge = mock(LeaveAccountingBridge.class);

    AbsenceService service = new AbsenceService(absenceRepo, dayRepo, userRepo, teamMemberRepo, bridge);

    @Test
    void createForEmail_shouldCreateAbsence_withFullDayDefaults() {
        User u = new User();
        u.setId("U1");
        u.setEmail("me@test.com");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(u));

        AbsenceCreateRequest req = new AbsenceCreateRequest();
        req.setStartDate(LocalDate.of(2025, 1, 1));
        req.setEndDate(LocalDate.of(2025, 1, 3));
        req.setType(AbsenceType.RTT);
        req.setReason("Vacances");
        req.setSupportingDocumentUrl("url");

        Absence saved = new Absence();
        saved.setId(10L);
        saved.setUserId("U1");
        saved.setStartDate(LocalDate.of(2025, 1, 1));
        saved.setEndDate(LocalDate.of(2025, 1, 3));
        when(absenceRepo.save(any(Absence.class))).thenReturn(saved);

        var result = service.createForEmail("me@test.com", req);

        verify(absenceRepo).save(any(Absence.class));
        verify(dayRepo).saveAll(anyList());
        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getStatus()).isEqualTo(AbsenceStatus.PENDING);
    }

    @Test
    void createForEmail_shouldApplyPeriodOverrides_AM_and_PM() {
        User u = new User();
        u.setId("U2");
        u.setEmail("period@test.com");
        when(userRepo.findByEmail("period@test.com")).thenReturn(Optional.of(u));

        AbsenceCreateRequest req = new AbsenceCreateRequest();
        req.setStartDate(LocalDate.of(2025, 2, 1));
        req.setEndDate(LocalDate.of(2025, 2, 2));
        req.setType(AbsenceType.RTT);
        req.setReason("test");
        Map<LocalDate, AbsencePeriod> periodMap = new HashMap<>();
        periodMap.put(LocalDate.of(2025, 2, 1), AbsencePeriod.AM);
        periodMap.put(LocalDate.of(2025, 2, 2), AbsencePeriod.PM);
        req.setPeriodByDate(periodMap);

        Absence saved = new Absence();
        saved.setId(11L);
        saved.setUserId("U2");
        saved.setStartDate(LocalDate.of(2025, 2, 1));
        saved.setEndDate(LocalDate.of(2025, 2, 2));
        when(absenceRepo.save(any(Absence.class))).thenReturn(saved);

        ArgumentCaptor<List<AbsenceDay>> captor = ArgumentCaptor.forClass(List.class);
        service.createForEmail("period@test.com", req);

        verify(dayRepo).saveAll(captor.capture());
        List<AbsenceDay> days = captor.getValue();
        assertThat(days).hasSize(2);
        assertThat(days.get(0).getPeriod()).isEqualTo(AbsencePeriod.AM);
        assertThat(days.get(1).getPeriod()).isEqualTo(AbsencePeriod.PM);
    }

    @Test
    void createForEmail_shouldThrow_whenUserNotFound() {
        when(userRepo.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        AbsenceCreateRequest req = new AbsenceCreateRequest();
        req.setStartDate(LocalDate.now());
        req.setEndDate(LocalDate.now().plusDays(1));
        req.setType(AbsenceType.RTT);

        assertThatThrownBy(() -> service.createForEmail("ghost@test.com", req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void createForEmail_shouldThrow_whenDatesNull() {
        User u = new User();
        u.setId("U3");
        u.setEmail("null@test.com");
        when(userRepo.findByEmail("null@test.com")).thenReturn(Optional.of(u));

        AbsenceCreateRequest req = new AbsenceCreateRequest();
        req.setType(AbsenceType.RTT);

        assertThatThrownBy(() -> service.createForEmail("null@test.com", req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("startDate and endDate are required");
    }

    @Test
    void createForEmail_shouldThrow_whenStartAfterEnd() {
        User u = new User();
        u.setId("U4");
        u.setEmail("bad@test.com");
        when(userRepo.findByEmail("bad@test.com")).thenReturn(Optional.of(u));

        AbsenceCreateRequest req = new AbsenceCreateRequest();
        req.setStartDate(LocalDate.of(2025, 3, 10));
        req.setEndDate(LocalDate.of(2025, 3, 1));
        req.setType(AbsenceType.RTT);

        assertThatThrownBy(() -> service.createForEmail("bad@test.com", req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("startDate must be on/before endDate");
    }
}
