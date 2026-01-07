package com.example.time_manager.services;

import com.example.time_manager.dto.clock.ClockResponse;
import com.example.time_manager.dto.work_schedule.WorkScheduleResponse;
import com.example.time_manager.model.*;
import com.example.time_manager.model.absence.*;
import com.example.time_manager.repository.*;
import com.example.time_manager.service.AutoReportService;
import com.example.time_manager.service.WorkScheduleService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;

import java.time.*;
import java.util.List;
import java.util.Optional;

import static com.example.time_manager.model.absence.AbsenceType.RTT;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AutoReportServiceTest {

    UserRepository userRepo = mock(UserRepository.class);
    TeamMemberRepository teamRepo = mock(TeamMemberRepository.class);
    ReportRepository reportRepo = mock(ReportRepository.class);
    WorkScheduleService workScheduleService = mock(WorkScheduleService.class);

    AutoReportService service =
            new AutoReportService(userRepo, teamRepo, reportRepo, workScheduleService);

    @Test
    void onAbsenceRequested_shouldCreateReportForManager() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");

        Absence a = makeAbsence(employee.getId());

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(manager));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        service.onAbsenceRequested(a);

        verify(reportRepo).save(any(Report.class));
    }

    @Test
    void onAbsenceRequested_shouldFallbackToAdmin() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User admin = makeUser("A1", "admin@test.com", "[\"ADMIN\"]");

        Absence a = makeAbsence(employee.getId());

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of());
        when(userRepo.findAll()).thenReturn(List.of(admin));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        service.onAbsenceRequested(a);

        verify(reportRepo).save(any());
    }

    @Test
    void onAbsenceRequested_shouldReturn_whenNull() {
        service.onAbsenceRequested(null);
        verifyNoInteractions(reportRepo);
    }

    @Test
    void onAbsenceStatusChanged_shouldCreateReport() {
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Absence a = makeAbsence(employee.getId());
        a.setStatus(AbsenceStatus.APPROVED);

        when(userRepo.findByEmail("manager@test.com")).thenReturn(Optional.of(manager));
        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        service.onAbsenceStatusChanged("manager@test.com", a, AbsenceStatus.PENDING);

        verify(reportRepo).save(any());
    }

    @Test
    void onAbsenceStatusChanged_shouldReturn_whenSameStatus() {
        Absence a = makeAbsence("U1");
        a.setStatus(AbsenceStatus.APPROVED);

        service.onAbsenceStatusChanged("x@test.com", a, AbsenceStatus.APPROVED);

        verifyNoInteractions(reportRepo);
    }

    @Test
    void onClockCreated_shouldCreateLateReport() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User system = makeUser("SYS", "system@time-manager.local", "[\"ADMIN\"]");

        Instant in = Instant.parse("2025-01-06T12:10:00Z");

        ClockResponse cr = clock(ClockKind.IN, in);

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(manager));
        when(userRepo.findByEmail("system@time-manager.local")).thenReturn(Optional.of(system));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.IN, in, List.of(cr));

        verify(reportRepo).save(any());
    }

    @Test
    void onClockCreated_shouldCreateOverworkReport() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User system = makeUser("SYS", "system@time-manager.local", "[\"ADMIN\"]");

        Instant in = Instant.parse("2025-01-06T12:10:00Z");
        Instant out = Instant.parse("2025-01-06T22:30:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(manager));
        when(userRepo.findByEmail("system@time-manager.local")).thenReturn(Optional.of(system));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(
                        ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00"),
                        ws(WorkDay.MON, WorkPeriod.PM, "13:00:00", "17:00:00")
                ));

        service.onClockCreated(
                employee.getId(),
                ClockKind.OUT,
                out,
                List.of(clock(ClockKind.IN, in), clock(ClockKind.OUT, out))
        );

        verify(reportRepo).save(any());

        reset(reportRepo);
        service.onClockCreated(
                employee.getId(),
                ClockKind.OUT,
                out,
                List.of(clock(ClockKind.OUT, Instant.parse("2025-01-06T21:00:00Z"))) // last.at != out
        );

        verifyNoInteractions(reportRepo);
    }

    @Test
    void systemUser_shouldThrow_ifMissing() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");

        Instant in = Instant.parse("2025-01-06T12:10:00Z");

        ClockResponse cr = clock(ClockKind.IN, in);

        when(userRepo.findById("U1")).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId("U1")).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(manager));

        when(userRepo.findByEmail("system@time-manager.local"))
                .thenReturn(Optional.empty());

        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        when(workScheduleService.listForUser("U1"))
                .thenReturn(List.of(
                        ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00")
                ));

        assertThatThrownBy(() ->
                service.onClockCreated("U1", ClockKind.IN, in, List.of(cr)))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("SYSTEM user missing");
    }

    @Test
    void onAbsenceRequested_shouldReturn_whenNoManagersAndNoAdmins() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        Absence a = makeAbsence(employee.getId());

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of());
        when(userRepo.findAll()).thenReturn(List.of());

        service.onAbsenceRequested(a);

        verifyNoInteractions(reportRepo);
    }

    @Test
    void onAbsenceRequested_shouldIncludeReason() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");

        Absence a = makeAbsence(employee.getId());
        a.setReason("Medical");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(manager));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        service.onAbsenceRequested(a);

        verify(reportRepo).save(argThat(r -> r.getBody().contains("Reason : Medical")));
    }

    @Test
    void onAbsenceRequested_shouldSkip_whenRuleKeyExists() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");

        Absence a = makeAbsence(employee.getId());

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(manager));
        when(reportRepo.existsByRuleKey(any())).thenReturn(true);

        service.onAbsenceRequested(a);

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onAbsenceStatusChanged_shouldReturn_whenAbsenceNull() {
        service.onAbsenceStatusChanged("x@test.com", null, null);
        verifyNoInteractions(reportRepo);
    }

    @Test
    void onAbsenceStatusChanged_shouldSetWarnSeverity_whenRejected() {
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Absence a = makeAbsence(employee.getId());
        a.setStatus(AbsenceStatus.REJECTED);

        when(userRepo.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        service.onAbsenceStatusChanged(manager.getEmail(), a, AbsenceStatus.PENDING);

        verify(reportRepo).save(argThat(r -> r.getSeverity().equals("WARN")));
    }

    @Test
    void onClockCreated_shouldReturn_whenInvalidParams() {
        service.onClockCreated(null, ClockKind.IN, Instant.now(), List.of());
        service.onClockCreated("U", null, Instant.now(), List.of());
        service.onClockCreated("U", ClockKind.IN, null, List.of());
        service.onClockCreated("U", ClockKind.IN, Instant.now(), null);

        verifyNoInteractions(reportRepo);
    }

    @Test
    void onClockCreated_shouldReturn_whenNoInClock() {
        service.onClockCreated(
                "U",
                ClockKind.IN,
                Instant.now(),
                List.of(clock(ClockKind.OUT, Instant.now()))
        );

        verifyNoInteractions(reportRepo);
    }

    @Test
    void onClockCreated_shouldReturn_whenNotFirstIn() {
        Instant t1 = Instant.parse("2025-01-06T10:00:00Z");
        Instant t2 = Instant.parse("2025-01-06T11:00:00Z");

        service.onClockCreated(
                "U",
                ClockKind.IN,
                t2,
                List.of(clock(ClockKind.IN, t1), clock(ClockKind.IN, t2))
        );

        verifyNoInteractions(reportRepo);
    }

    @Test
    void onClockCreated_shouldNotifyAdmins_whenSubjectIsManager() {
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User admin = makeUser("A1", "admin@test.com", "[\"ADMIN\"]");
        User system = makeUser("SYS", "system@time-manager.local", "[\"ADMIN\"]");

        Instant in = Instant.parse("2025-01-06T12:10:00Z");

        when(userRepo.findById("M1")).thenReturn(Optional.of(manager));
        when(userRepo.findAll()).thenReturn(List.of(admin));
        when(userRepo.findByEmail("system@time-manager.local")).thenReturn(Optional.of(system));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        when(workScheduleService.listForUser("M1"))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00")));

        service.onClockCreated("M1", ClockKind.IN, in, List.of(clock(ClockKind.IN, in)));

        verify(reportRepo).save(any());
    }

    @Test
    void onClockCreated_shouldReturn_whenLeavingTooEarly() {
        Instant in = Instant.parse("2025-01-06T12:00:00Z");
        Instant out = Instant.parse("2025-01-06T16:40:00Z");

        when(workScheduleService.listForUser("U"))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.PM, "13:00:00", "17:00:00")));

        service.onClockCreated("U", ClockKind.OUT, out,
                List.of(clock(ClockKind.IN, in), clock(ClockKind.OUT, out)));

        verifyNoInteractions(reportRepo);
    }

    @Test
    void onClockCreated_shouldCreateOverworkForAdmins_whenManager() {
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User admin = makeUser("A1", "admin@test.com", "[\"ADMIN\"]");
        User system = makeUser("SYS", "system@time-manager.local", "[\"ADMIN\"]");

        Instant in = Instant.parse("2025-01-06T12:00:00Z");
        Instant out = Instant.parse("2025-01-06T23:00:00Z");

        when(userRepo.findById("M1")).thenReturn(Optional.of(manager));
        when(userRepo.findAll()).thenReturn(List.of(admin));
        when(userRepo.findByEmail("system@time-manager.local")).thenReturn(Optional.of(system));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        when(workScheduleService.listForUser("M1"))
                .thenReturn(List.of(
                        ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00"),
                        ws(WorkDay.MON, WorkPeriod.PM, "13:00:00", "17:00:00")
                ));

        service.onClockCreated("M1", ClockKind.OUT, out,
                List.of(clock(ClockKind.IN, in), clock(ClockKind.OUT, out)));

        verify(reportRepo).save(any());
    }

    @Test
    void utilityCoverage_parseTime_and_toWorkDay_and_hasRole() {
        User u = makeUser("U", "u@test.com", null);
        when(userRepo.findById("U")).thenReturn(Optional.of(u));

        when(workScheduleService.listForUser("U"))
                .thenReturn(List.of(
                        ws(WorkDay.TUE, WorkPeriod.AM, null, "12:00"),
                        ws(WorkDay.WED, WorkPeriod.AM, "09:00", "12:00"),
                        ws(WorkDay.THU, WorkPeriod.AM, "09:00:00", "12:00:00"),
                        ws(WorkDay.FRI, WorkPeriod.AM, "09:00:00", "12:00:00"),
                        ws(WorkDay.SAT, WorkPeriod.AM, "09:00:00", "12:00:00"),
                        ws(WorkDay.SUN, WorkPeriod.AM, "09:00:00", "12:00:00")
                ));

        Instant in = Instant.parse("2025-01-07T12:10:00Z");

        service.onClockCreated("U", ClockKind.IN, in, List.of(clock(ClockKind.IN, in)));
    }

    @Test
    void onAbsenceStatusChanged_shouldContinue_whenPreviousDifferentFromCurrent() {
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Absence a = makeAbsence(employee.getId());
        a.setStatus(AbsenceStatus.APPROVED);

        when(userRepo.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));

        when(reportRepo.existsByRuleKey(any())).thenReturn(true);

        service.onAbsenceStatusChanged(
                manager.getEmail(),
                a,
                AbsenceStatus.REJECTED
        );

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onAbsenceStatusChanged_shouldContinue_whenPreviousIsNull() {
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Absence a = makeAbsence(employee.getId());
        a.setStatus(AbsenceStatus.APPROVED);

        when(userRepo.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));

        when(reportRepo.existsByRuleKey(any())).thenReturn(true);

        service.onAbsenceStatusChanged(manager.getEmail(), a, null);

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldReturn_whenOutAndNoSchedule() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Instant in = Instant.parse("2025-01-06T09:00:00Z");
        Instant out = Instant.parse("2025-01-06T17:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(workScheduleService.listForUser(employee.getId())).thenReturn(List.of());

        service.onClockCreated(
                employee.getId(),
                ClockKind.OUT,
                out,
                List.of(clock(ClockKind.IN, in), clock(ClockKind.OUT, out))
        );

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldCoverAllDaysOfWeek() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(workScheduleService.listForUser(employee.getId())).thenReturn(List.of());

        service.onClockCreated(employee.getId(), ClockKind.OUT,
                Instant.parse("2025-01-06T17:00:00Z"),
                List.of(clock(ClockKind.IN, Instant.parse("2025-01-06T09:00:00Z")),
                        clock(ClockKind.OUT, Instant.parse("2025-01-06T17:00:00Z"))));

        service.onClockCreated(employee.getId(), ClockKind.OUT,
                Instant.parse("2025-01-07T17:00:00Z"),
                List.of(clock(ClockKind.IN, Instant.parse("2025-01-07T09:00:00Z")),
                        clock(ClockKind.OUT, Instant.parse("2025-01-07T17:00:00Z"))));

        service.onClockCreated(employee.getId(), ClockKind.OUT,
                Instant.parse("2025-01-08T17:00:00Z"),
                List.of(clock(ClockKind.IN, Instant.parse("2025-01-08T09:00:00Z")),
                        clock(ClockKind.OUT, Instant.parse("2025-01-08T17:00:00Z"))));

        service.onClockCreated(employee.getId(), ClockKind.OUT,
                Instant.parse("2025-01-09T17:00:00Z"),
                List.of(clock(ClockKind.IN, Instant.parse("2025-01-09T09:00:00Z")),
                        clock(ClockKind.OUT, Instant.parse("2025-01-09T17:00:00Z"))));

        service.onClockCreated(employee.getId(), ClockKind.OUT,
                Instant.parse("2025-01-10T17:00:00Z"),
                List.of(clock(ClockKind.IN, Instant.parse("2025-01-10T09:00:00Z")),
                        clock(ClockKind.OUT, Instant.parse("2025-01-10T17:00:00Z"))));

        service.onClockCreated(employee.getId(), ClockKind.OUT,
                Instant.parse("2025-01-11T17:00:00Z"),
                List.of(clock(ClockKind.IN, Instant.parse("2025-01-11T09:00:00Z")),
                        clock(ClockKind.OUT, Instant.parse("2025-01-11T17:00:00Z"))));

        service.onClockCreated(employee.getId(), ClockKind.OUT,
                Instant.parse("2025-01-12T17:00:00Z"),
                List.of(clock(ClockKind.IN, Instant.parse("2025-01-12T09:00:00Z")),
                        clock(ClockKind.OUT, Instant.parse("2025-01-12T17:00:00Z"))));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onAbsenceRequested_shouldHandleNullTeamIds() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User admin = makeUser("A1", "admin@test.com", "[\"ADMIN\"]");

        Absence a = makeAbsence(employee.getId());

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(null);
        when(userRepo.findAll()).thenReturn(List.of(admin));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        service.onAbsenceRequested(a);

        verify(reportRepo).save(any());
    }

    @Test
    void onAbsenceRequested_shouldHandleNullUsersFromTeam() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User admin = makeUser("A1", "admin@test.com", "[\"ADMIN\"]");

        Absence a = makeAbsence(employee.getId());

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(null);
        when(userRepo.findAll()).thenReturn(List.of(admin));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        service.onAbsenceRequested(a);

        verify(reportRepo).save(any());
    }

    @Test
    void onAbsenceRequested_shouldSkipNonManagerUsers() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User otherEmployee = makeUser("U2", "other@test.com", "[\"EMPLOYEE\"]");
        User admin = makeUser("A1", "admin@test.com", "[\"ADMIN\"]");

        Absence a = makeAbsence(employee.getId());

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(otherEmployee));
        when(userRepo.findAll()).thenReturn(List.of(admin));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        service.onAbsenceRequested(a);

        verify(reportRepo).save(any());
    }

    @Test
    void onClockCreated_shouldHandleUserWithNullRole_whenCheckingManager() {
        User employee = makeUser("U1", "emp@test.com", null);
        User admin = makeUser("A1", "admin@test.com", "[\"ADMIN\"]");
        User system = makeUser("SYS", "system@time-manager.local", "[\"ADMIN\"]");

        Instant in = Instant.parse("2025-01-06T12:10:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(employee));
        when(userRepo.findByEmail("system@time-manager.local")).thenReturn(Optional.of(system));
        when(userRepo.findAll()).thenReturn(List.of(admin));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.IN, in, List.of(clock(ClockKind.IN, in)));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldReturn_whenScheduleHasNullExpectedStart() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Instant in = Instant.parse("2025-01-06T09:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, null, "12:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.IN, in, List.of(clock(ClockKind.IN, in)));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldReturn_whenArrivalIsOnTime() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Instant in = Instant.parse("2025-01-06T09:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.IN, in, List.of(clock(ClockKind.IN, in)));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldReturn_whenArrivalWithinGracePeriod() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        // Arrives at 09:05 (exactly at grace limit)
        Instant in = Instant.parse("2025-01-06T09:05:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.IN, in, List.of(clock(ClockKind.IN, in)));

        verify(reportRepo, never()).save(any());
    }
    @Test
    void onClockCreated_shouldReturn_whenOutClocksEmpty() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Instant out = Instant.parse("2025-01-06T17:00:00Z");

        service.onClockCreated(employee.getId(), ClockKind.OUT, out, List.of());

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldHandleScheduleWithoutPmPeriod() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User system = makeUser("SYS", "system@time-manager.local", "[\"ADMIN\"]");

        Instant in = Instant.parse("2025-01-06T09:00:00Z");
        Instant out = Instant.parse("2025-01-06T17:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(manager));
        when(userRepo.findByEmail("system@time-manager.local")).thenReturn(Optional.of(system));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        // Only AM schedule, no PM - so pmEnd will be null
        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.OUT, out,
                List.of(clock(ClockKind.IN, in), clock(ClockKind.OUT, out)));

        verify(reportRepo).save(any());
    }

    @Test
    void onClockCreated_shouldReturn_whenExpectedMinutesZero() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Instant in = Instant.parse("2025-01-06T09:00:00Z");
        Instant out = Instant.parse("2025-01-06T17:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));

        // Schedule with null start/end times results in 0 expected minutes
        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.PM, null, null)));

        service.onClockCreated(employee.getId(), ClockKind.OUT, out,
                List.of(clock(ClockKind.IN, in), clock(ClockKind.OUT, out)));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldSkip_whenLateReportRuleKeyExists() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User system = makeUser("SYS", "system@time-manager.local", "[\"ADMIN\"]");

        Instant in = Instant.parse("2025-01-06T12:10:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(manager));
        when(userRepo.findByEmail("system@time-manager.local")).thenReturn(Optional.of(system));
        when(reportRepo.existsByRuleKey(any())).thenReturn(true);

        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.IN, in, List.of(clock(ClockKind.IN, in)));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldSkip_whenOverworkReportRuleKeyExists() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User system = makeUser("SYS", "system@time-manager.local", "[\"ADMIN\"]");

        Instant in = Instant.parse("2025-01-06T09:00:00Z");
        Instant out = Instant.parse("2025-01-06T23:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(manager));
        when(userRepo.findByEmail("system@time-manager.local")).thenReturn(Optional.of(system));
        when(reportRepo.existsByRuleKey(any())).thenReturn(true);

        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "17:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.OUT, out,
                List.of(clock(ClockKind.IN, in), clock(ClockKind.OUT, out)));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldReturn_whenInAndNoSchedule() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Instant in = Instant.parse("2025-01-06T12:10:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(workScheduleService.listForUser(employee.getId())).thenReturn(List.of());

        service.onClockCreated(employee.getId(), ClockKind.IN, in, List.of(clock(ClockKind.IN, in)));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldIgnoreConsecutiveInClocks() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");
        User manager = makeUser("M1", "manager@test.com", "[\"MANAGER\"]");
        User system = makeUser("SYS", "system@time-manager.local", "[\"ADMIN\"]");

        Instant in1 = Instant.parse("2025-01-06T09:00:00Z");
        Instant in2 = Instant.parse("2025-01-06T10:00:00Z"); // consecutive IN, should be ignored
        Instant out = Instant.parse("2025-01-06T20:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(teamRepo.findTeamIdsByUserId(employee.getId())).thenReturn(List.of(1L));
        when(teamRepo.findUsersByTeamId(1L)).thenReturn(List.of(manager));
        when(userRepo.findByEmail("system@time-manager.local")).thenReturn(Optional.of(system));
        when(reportRepo.existsByRuleKey(any())).thenReturn(false);

        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "12:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.OUT, out,
                List.of(clock(ClockKind.IN, in1), clock(ClockKind.IN, in2), clock(ClockKind.OUT, out)));

        verify(reportRepo).save(any());
    }

    @Test
    void onClockCreated_shouldHandleOutWithoutPriorIn() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Instant out1 = Instant.parse("2025-01-06T12:00:00Z"); // OUT without prior IN
        Instant in = Instant.parse("2025-01-06T13:00:00Z");
        Instant out2 = Instant.parse("2025-01-06T17:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));

        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.PM, "13:00:00", "17:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.OUT, out2,
                List.of(clock(ClockKind.OUT, out1), clock(ClockKind.IN, in), clock(ClockKind.OUT, out2)));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldHandleScheduleWithNullEndTime() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Instant in = Instant.parse("2025-01-06T09:00:00Z");
        Instant out = Instant.parse("2025-01-06T17:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));

        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", null)));

        service.onClockCreated(employee.getId(), ClockKind.OUT, out,
                List.of(clock(ClockKind.IN, in), clock(ClockKind.OUT, out)));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldHandleScheduleWithEndBeforeStart() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Instant in = Instant.parse("2025-01-06T09:00:00Z");
        Instant out = Instant.parse("2025-01-06T17:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));

        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "12:00:00", "09:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.OUT, out,
                List.of(clock(ClockKind.IN, in), clock(ClockKind.OUT, out)));

        verify(reportRepo, never()).save(any());
    }

    @Test
    void onClockCreated_shouldHandleScheduleWithEqualStartAndEnd() {
        User employee = makeUser("U1", "emp@test.com", "[\"EMPLOYEE\"]");

        Instant in = Instant.parse("2025-01-06T09:00:00Z");
        Instant out = Instant.parse("2025-01-06T17:00:00Z");

        when(userRepo.findById(employee.getId())).thenReturn(Optional.of(employee));

        when(workScheduleService.listForUser(employee.getId()))
                .thenReturn(List.of(ws(WorkDay.MON, WorkPeriod.AM, "09:00:00", "09:00:00")));

        service.onClockCreated(employee.getId(), ClockKind.OUT, out,
                List.of(clock(ClockKind.IN, in), clock(ClockKind.OUT, out)));

        verify(reportRepo, never()).save(any());
    }





    private static User makeUser(String id, String email, String role) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setRole(role);
        return u;
    }

    private static Absence makeAbsence(String userId) {
        Absence a = new Absence();
        a.setId(1L);
        a.setUserId(userId);
        a.setType(RTT);
        a.setStatus(AbsenceStatus.PENDING);
        a.setStartDate(LocalDate.now());
        a.setEndDate(LocalDate.now().plusDays(1));
        return a;
    }

    private static ClockResponse clock(ClockKind kind, Instant at) {
        ClockResponse c = new ClockResponse();
        c.kind = kind;
        c.at = at;
        return c;
    }

    private static WorkScheduleResponse ws(
            WorkDay day,
            WorkPeriod period,
            String start,
            String end
    ) {
        return new WorkScheduleResponse(
                "WS1",
                "U1",
                day,
                period,
                start,
                end
        );
    }
}
