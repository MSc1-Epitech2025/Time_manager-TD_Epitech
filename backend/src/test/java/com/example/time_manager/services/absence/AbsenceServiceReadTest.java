package com.example.time_manager.services.absence;

import com.example.time_manager.dto.absence.AbsenceStatusUpdateRequest;
import com.example.time_manager.dto.absence.AbsenceUpdateRequest;
import com.example.time_manager.model.User;
import com.example.time_manager.model.absence.Absence;
import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.repository.AbsenceDayRepository;
import com.example.time_manager.repository.AbsenceRepository;
import com.example.time_manager.repository.TeamMemberRepository;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.AbsenceService;
import com.example.time_manager.service.leave.LeaveAccountingBridge;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AbsenceServiceReadTest {

    AbsenceRepository absenceRepo = mock(AbsenceRepository.class);
    AbsenceDayRepository dayRepo = mock(AbsenceDayRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    TeamMemberRepository teamMemberRepo = mock(TeamMemberRepository.class);
    LeaveAccountingBridge bridge = mock(LeaveAccountingBridge.class);

    AbsenceService service = new AbsenceService(absenceRepo, dayRepo, userRepo, teamMemberRepo, bridge);

    @BeforeEach
    void setupContext() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listMine_shouldReturnAbsencesForCurrentUser() {
        User u = new User();
        u.setId("U1");
        u.setEmail("me@test.com");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(u));

        Absence a = new Absence();
        a.setId(1L);
        a.setUserId("U1");
        a.setStartDate(LocalDate.of(2025, 1, 1));
        a.setEndDate(LocalDate.of(2025, 1, 2));
        a.setStatus(AbsenceStatus.APPROVED);

        when(absenceRepo.findByUserIdOrderByStartDateDesc("U1")).thenReturn(List.of(a));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(1L)).thenReturn(List.of());

        var res = service.listMine("me@test.com");
        assertThat(res).hasSize(1);
        assertThat(res.get(0).getId()).isEqualTo(1L);
    }

    @Test
    void listMine_shouldThrow_whenUserNotFound() {
        when(userRepo.findByEmail("ghost@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.listMine("ghost@test.com"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void listForUser_shouldAllowAdmin() {
        var auth = new TestingAuthenticationToken("U_ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("U_ADMIN");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findById("U_ADMIN")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(10L);
        a.setUserId("TARGET");
        when(absenceRepo.findByUserIdOrderByStartDateDesc("TARGET")).thenReturn(List.of(a));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(10L)).thenReturn(List.of());

        var result = service.listForUser("TARGET");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(10L);
    }

    @Test
    void listForUser_shouldAllowOwner() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User u = new User();
        u.setId("U1");
        when(userRepo.findById("U1")).thenReturn(Optional.of(u));

        Absence a = new Absence();
        a.setId(20L);
        a.setUserId("U1");
        when(absenceRepo.findByUserIdOrderByStartDateDesc("U1")).thenReturn(List.of(a));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(20L)).thenReturn(List.of());

        var result = service.listForUser("U1");
        assertThat(result).hasSize(1);
    }

    @Test
    void listForUser_shouldAllowManagerThatCanAct() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findById("M1")).thenReturn(Optional.of(manager));

        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(10L));
        when(teamMemberRepo.existsByTeam_IdAndUser_Id(10L, "U_TARGET")).thenReturn(true);

        Absence a = new Absence();
        a.setId(555L);
        a.setUserId("U_TARGET");

        when(absenceRepo.findByUserIdOrderByStartDateDesc("U_TARGET")).thenReturn(List.of(a));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(555L)).thenReturn(List.of());

        var result = service.listForUser("U_TARGET");
        assertThat(result).hasSize(1);
    }

    @Test
    void listForUser_shouldThrowIfForbidden_forEmployee() {
        var auth = new TestingAuthenticationToken("U_NO", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User requester = new User();
        requester.setId("U_NO");
        requester.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findById("U_NO")).thenReturn(Optional.of(requester));

        assertThatThrownBy(() -> service.listForUser("TARGET"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("Forbidden");
    }

    @Test
    void listForUser_shouldThrow_ifManagerCannotActEvenWithRoleManager() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findById("M1")).thenReturn(Optional.of(manager));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of());

        assertThatThrownBy(() -> service.listForUser("TARGET_USER"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void listAll_shouldReturn_whenAdmin() {
        var auth = new TestingAuthenticationToken("any", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        Absence a = new Absence();
        a.setId(1L);
        when(absenceRepo.findAllByOrderByStartDateDesc()).thenReturn(List.of(a));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(1L)).thenReturn(List.of());

        var res = service.listAll();
        assertThat(res).hasSize(1);
    }

    @Test
    void listAll_shouldThrow_ifNotAdmin() {
        var auth = new TestingAuthenticationToken("any", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThatThrownBy(() -> service.listAll())
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("admin only");
    }

    @Test
    void getVisibleTo_shouldReturnForAdmin() {
        var auth = new TestingAuthenticationToken("U_ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User requester = new User();
        requester.setId("U_ADMIN");
        requester.setEmail("admin@test.com");
        requester.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(requester));

        Absence a = new Absence();
        a.setId(77L);
        a.setUserId("U_OWNER");
        when(absenceRepo.findById(77L)).thenReturn(Optional.of(a));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(77L)).thenReturn(List.of());

        var res = service.getVisibleTo("admin@test.com", 77L);
        assertThat(res.getId()).isEqualTo(77L);
    }

    @Test
    void getVisibleTo_shouldReturnForOwner() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User requester = new User();
        requester.setId("U1");
        requester.setEmail("me@test.com");
        requester.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(requester));

        Absence a = new Absence();
        a.setId(50L);
        a.setUserId("U1");
        when(absenceRepo.findById(50L)).thenReturn(Optional.of(a));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(50L)).thenReturn(List.of());

        var res = service.getVisibleTo("me@test.com", 50L);
        assertThat(res.getId()).isEqualTo(50L);
    }

    @Test
    void getVisibleTo_shouldReturnForManager_whenCanAct() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User m = new User();
        m.setId("M1");
        m.setEmail("m@test.com");
        m.setRole("[\"MANAGER\"]");
        when(userRepo.findByEmail("m@test.com")).thenReturn(Optional.of(m));

        Absence a = new Absence();
        a.setId(123L);
        a.setUserId("U2");
        when(absenceRepo.findById(123L)).thenReturn(Optional.of(a));

        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(10L));
        when(teamMemberRepo.existsByTeam_IdAndUser_Id(10L, "U2")).thenReturn(true);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(123L)).thenReturn(List.of());

        var res = service.getVisibleTo("m@test.com", 123L);
        assertThat(res.getId()).isEqualTo(123L);
    }

    @Test
    void getVisibleTo_shouldThrow_ifNotAllowed() {
        var auth = new TestingAuthenticationToken("U_NO", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User requester = new User();
        requester.setId("U_NO");
        requester.setEmail("no@test.com");
        requester.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("no@test.com")).thenReturn(Optional.of(requester));

        Absence a = new Absence();
        a.setId(99L);
        a.setUserId("U_OTHER");
        when(absenceRepo.findById(99L)).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> service.getVisibleTo("no@test.com", 99L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void getVisibleTo_shouldThrow_ifManagerCannotAct() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setRole("[\"MANAGER\"]");

        Absence a = new Absence();
        a.setId(700L);
        a.setUserId("U2");

        when(userRepo.findByEmail("m4@test.com")).thenReturn(Optional.of(manager));
        when(absenceRepo.findById(700L)).thenReturn(Optional.of(a));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of());

        assertThatThrownBy(() -> service.getVisibleTo("m4@test.com", 700L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("Forbidden");
    }

    @Test
    void listTeamAbsences_shouldReturnForManagerTeam() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setEmail("manager@test.com");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findByEmail("manager@test.com")).thenReturn(Optional.of(manager));

        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(1L));
        when(teamMemberRepo.findUsersByTeamId(1L)).thenReturn(List.of(
                makeUser("U1"), makeUser("U2")
        ));

        Absence a = new Absence();
        a.setId(5L);
        a.setUserId("U1");

        when(absenceRepo.findByUserIdInOrderByStartDateDesc(List.of("U1", "U2")))
                .thenReturn(List.of(a));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(5L)).thenReturn(List.of());

        var res = service.listTeamAbsences("manager@test.com", 1L);
        assertThat(res).hasSize(1);
    }

    @Test
    void listTeamAbsences_shouldThrow_ifNotManager() {
        var auth = new TestingAuthenticationToken("E1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User emp = new User();
        emp.setId("E1");
        emp.setEmail("emp@test.com");
        emp.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("emp@test.com")).thenReturn(Optional.of(emp));

        assertThatThrownBy(() -> service.listTeamAbsences("emp@test.com", 1L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("manager only");
    }

    @Test
    void listTeamAbsences_shouldThrow_ifNotManagerOfThisTeam() {
        var auth = new TestingAuthenticationToken("M2", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User m = new User();
        m.setId("M2");
        m.setEmail("m2@test.com");
        m.setRole("[\"MANAGER\"]");

        when(userRepo.findByEmail("m2@test.com")).thenReturn(Optional.of(m));
        when(teamMemberRepo.findTeamIdsByUserId("M2")).thenReturn(List.of(2L));

        assertThatThrownBy(() -> service.listTeamAbsences("m2@test.com", 99L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("not your team");
    }

    @Test
    void listTeamAbsences_shouldReturnEmpty_whenNoTeams() {
        var auth = new TestingAuthenticationToken("M3", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User m = new User();
        m.setId("M3");
        m.setEmail("m3@test.com");
        m.setRole("[\"MANAGER\"]");

        when(userRepo.findByEmail("m3@test.com")).thenReturn(Optional.of(m));
        when(teamMemberRepo.findTeamIdsByUserId("M3")).thenReturn(List.of());

        var res = service.listTeamAbsences("m3@test.com", null);
        assertThat(res).isEmpty();
    }

    @Test
    void listTeamAbsences_shouldIterateOverMultipleTeams() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setRole("[\"MANAGER\"]");

        when(userRepo.findByEmail("manager@test.com")).thenReturn(Optional.of(manager));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(1L, 2L));
        when(teamMemberRepo.findUsersByTeamId(1L)).thenReturn(List.of(makeUser("U1")));
        when(teamMemberRepo.findUsersByTeamId(2L)).thenReturn(List.of(makeUser("U2")));

        Absence abs = new Absence();
        abs.setId(100L);
        abs.setUserId("U1");

        when(absenceRepo.findByUserIdInOrderByStartDateDesc(List.of("U1", "U2")))
                .thenReturn(List.of(abs));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(100L)).thenReturn(List.of());

        var res = service.listTeamAbsences("manager@test.com", null);
        assertThat(res).hasSize(1);
    }

    @Test
    void updateVisibleTo_shouldThrow_whenNotAdminOwnerOrManager() {
        var auth = new TestingAuthenticationToken("U_NO", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User requester = new User();
        requester.setId("U_NO");
        requester.setEmail("u@test.com");
        requester.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(requester));

        Absence a = new Absence();
        a.setId(10L);
        a.setUserId("U_OTHER");
        a.setStatus(AbsenceStatus.PENDING);
        when(absenceRepo.findById(10L)).thenReturn(Optional.of(a));

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        assertThatThrownBy(() -> service.updateVisibleTo("u@test.com", 10L, req))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("Forbidden");
    }

    @Test
    void updateVisibleTo_shouldThrow_whenManagerCannotAct() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setEmail("m@test.com");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findByEmail("m@test.com")).thenReturn(Optional.of(manager));

        Absence a = new Absence();
        a.setId(11L);
        a.setUserId("U_TARGET");
        a.setStatus(AbsenceStatus.PENDING);

        when(absenceRepo.findById(11L)).thenReturn(Optional.of(a));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of());

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        assertThatThrownBy(() -> service.updateVisibleTo("m@test.com", 11L, req))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("Forbidden");
    }

    @Test
    void updateVisibleTo_shouldThrow_whenOwnerButStatusNotPending() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User owner = new User();
        owner.setId("U1");
        owner.setEmail("me@test.com");
        owner.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(owner));

        Absence a = new Absence();
        a.setId(12L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.APPROVED);
        when(absenceRepo.findById(12L)).thenReturn(Optional.of(a));

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        assertThatThrownBy(() -> service.updateVisibleTo("me@test.com", 12L, req))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("owner can edit only while PENDING");
    }

    @Test
    void updateVisibleTo_shouldAllowOwnerWhenPending_validDates() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User owner = new User();
        owner.setId("U1");
        owner.setEmail("me@test.com");
        owner.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(owner));

        Absence a = new Absence();
        a.setId(13L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);
        a.setStartDate(LocalDate.of(2025, 1, 1));
        a.setEndDate(LocalDate.of(2025, 1, 2));

        when(absenceRepo.findById(13L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenReturn(a);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(13L)).thenReturn(List.of());

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        req.setReason("update");

        var res = service.updateVisibleTo("me@test.com", 13L, req);
        assertThat(res.getId()).isEqualTo(13L);
    }

    @Test
    void updateVisibleTo_shouldAllowAdminWithApprovedStatus_andCallDebit() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setEmail("admin@test.com");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(20L);
        a.setUserId("U_X");
        a.setStatus(AbsenceStatus.APPROVED);
        a.setStartDate(LocalDate.of(2025, 1, 1));
        a.setEndDate(LocalDate.of(2025, 1, 3));

        when(absenceRepo.findById(20L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenReturn(a);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(20L)).thenReturn(List.of());

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        req.setReason("change by admin");

        var res = service.updateVisibleTo("admin@test.com", 20L, req);
        assertThat(res.getId()).isEqualTo(20L);
        verify(bridge).ensureDebitForApprovedAbsence(a);
    }

    @Test
    void updateVisibleTo_shouldAllowManagerWhenCanAct_andRebuildDays() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setEmail("m@test.com");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findByEmail("m@test.com")).thenReturn(Optional.of(manager));

        Absence a = new Absence();
        a.setId(30L);
        a.setUserId("U2");
        a.setStatus(AbsenceStatus.PENDING);
        a.setStartDate(LocalDate.of(2025, 1, 1));
        a.setEndDate(LocalDate.of(2025, 1, 2));

        when(absenceRepo.findById(30L)).thenReturn(Optional.of(a));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(10L));
        when(teamMemberRepo.existsByTeam_IdAndUser_Id(10L, "U2")).thenReturn(true);

        when(absenceRepo.save(any())).thenReturn(a);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(30L)).thenReturn(List.of());

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();
        req.setReason("manager update");
        req.setPeriodByDate(Map.of());

        var res = service.updateVisibleTo("m@test.com", 30L, req);
        assertThat(res.getId()).isEqualTo(30L);
        verify(dayRepo).deleteByAbsenceId(30L);
    }

    @Test
    void setStatus_shouldThrow_whenNotAdminNorManager() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User normal = new User();
        normal.setId("U1");
        normal.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(normal));

        Absence a = new Absence();
        a.setId(90L);
        a.setUserId("U_TARGET");
        when(absenceRepo.findById(90L)).thenReturn(Optional.of(a));

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(AbsenceStatus.APPROVED);

        assertThatThrownBy(() -> service.setStatus("u@test.com", 90L, req))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void setStatus_shouldThrow_ifManagerCannotAct() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findByEmail("m3@test.com")).thenReturn(Optional.of(manager));

        Absence a = new Absence();
        a.setId(321L);
        a.setUserId("U2");
        a.setStatus(AbsenceStatus.PENDING);

        when(absenceRepo.findById(321L)).thenReturn(Optional.of(a));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of());

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(AbsenceStatus.APPROVED);

        assertThatThrownBy(() -> service.setStatus("m3@test.com", 321L, req))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void setStatus_shouldThrow_whenSettingPendingStatus() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setEmail("x@test.com");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("x@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(444L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.APPROVED);

        when(absenceRepo.findById(444L)).thenReturn(Optional.of(a));

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(AbsenceStatus.PENDING);

        assertThatThrownBy(() -> service.setStatus("x@test.com", 444L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("APPROVED or REJECTED");
    }

    @Test
    void setStatus_shouldAllowAdminApproved_callsEnsureDebit() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setEmail("x@test.com");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("x@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(10L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);

        when(absenceRepo.findById(10L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(10L)).thenReturn(List.of());

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(AbsenceStatus.APPROVED);

        var res = service.setStatus("x@test.com", 10L, req);
        assertThat(res.getStatus()).isEqualTo(AbsenceStatus.APPROVED);
        verify(bridge).ensureDebitForApprovedAbsence(a);
    }

    @Test
    void setStatus_shouldAllowManagerIfCanAct() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findByEmail("m@test.com")).thenReturn(Optional.of(manager));

        Absence a = new Absence();
        a.setId(5L);
        a.setUserId("U2");
        a.setStatus(AbsenceStatus.PENDING);

        when(absenceRepo.findById(5L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(10L));
        when(teamMemberRepo.existsByTeam_IdAndUser_Id(10L, "U2")).thenReturn(true);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(5L)).thenReturn(List.of());

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(AbsenceStatus.APPROVED);

        var res = service.setStatus("m@test.com", 5L, req);
        assertThat(res.getStatus()).isEqualTo(AbsenceStatus.APPROVED);
    }

    @Test
    void setStatus_shouldCallRemoveDebitOnRejected() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findByEmail("m5@test.com")).thenReturn(Optional.of(manager));

        Absence a = new Absence();
        a.setId(800L);
        a.setUserId("U2");
        a.setStatus(AbsenceStatus.PENDING);

        when(absenceRepo.findById(800L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(10L));
        when(teamMemberRepo.existsByTeam_IdAndUser_Id(10L, "U2")).thenReturn(true);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(800L)).thenReturn(List.of());

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(AbsenceStatus.REJECTED);

        service.setStatus("m5@test.com", 800L, req);
        verify(bridge).removeDebitForAbsence(800L);
    }

    @Test
    void setStatus_shouldHitDefaultCaseOfSwitch() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setId("ADMIN");
        admin.setEmail("x@test.com");
        admin.setRole("[\"ADMIN\"]");
        when(userRepo.findByEmail("x@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(444L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);

        when(absenceRepo.findById(444L)).thenReturn(Optional.of(a));
        when(absenceRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(444L)).thenReturn(List.of());

        AbsenceStatus fake = mock(AbsenceStatus.class);

        AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
        req.setStatus(fake);

        service.setStatus("x@test.com", 444L, req);
    }

    @Test
    void deleteVisibleTo_shouldThrow_whenNotAdminOwnerManager() {
        var auth = new TestingAuthenticationToken("U_NO", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User normal = new User();
        normal.setId("U_NO");
        normal.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("n@test.com")).thenReturn(Optional.of(normal));

        Absence a = new Absence();
        a.setId(1L);
        a.setUserId("U_OTHER");
        a.setStatus(AbsenceStatus.PENDING);
        when(absenceRepo.findById(1L)).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> service.deleteVisibleTo("n@test.com", 1L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("Forbidden");
    }

    @Test
    void deleteVisibleTo_shouldThrow_ifManagerCannotAct() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findByEmail("mgr@test.com")).thenReturn(Optional.of(manager));

        Absence a = new Absence();
        a.setId(1234L);
        a.setUserId("U5");
        a.setStatus(AbsenceStatus.PENDING);

        when(absenceRepo.findById(1234L)).thenReturn(Optional.of(a));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of());

        assertThatThrownBy(() -> service.deleteVisibleTo("mgr@test.com", 1234L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void deleteVisibleTo_ownerCannotDeleteIfNotPending() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User owner = new User();
        owner.setId("U1");
        owner.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(owner));

        Absence a = new Absence();
        a.setId(600L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.APPROVED);

        when(absenceRepo.findById(600L)).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> service.deleteVisibleTo("me@test.com", 600L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("owner can delete only while PENDING");
    }

    @Test
    void deleteVisibleTo_shouldAllowOwner_whenPending() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User owner = new User();
        owner.setId("U1");
        owner.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(owner));

        Absence a = new Absence();
        a.setId(200L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.PENDING);
        when(absenceRepo.findById(200L)).thenReturn(Optional.of(a));

        service.deleteVisibleTo("me@test.com", 200L);

        verify(bridge).removeDebitForAbsence(200L);
        verify(dayRepo).deleteByAbsenceId(200L);
        verify(absenceRepo).deleteById(200L);
    }

    @Test
    void deleteVisibleTo_shouldAllowManagerIfCanAct_pending() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findByEmail("m@test.com")).thenReturn(Optional.of(manager));

        Absence a = new Absence();
        a.setId(99L);
        a.setUserId("U2");
        a.setStatus(AbsenceStatus.PENDING);

        when(absenceRepo.findById(99L)).thenReturn(Optional.of(a));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(10L));
        when(teamMemberRepo.existsByTeam_IdAndUser_Id(10L, "U2")).thenReturn(true);

        service.deleteVisibleTo("m@test.com", 99L);

        verify(bridge).removeDebitForAbsence(99L);
        verify(dayRepo).deleteByAbsenceId(99L);
        verify(absenceRepo).deleteById(99L);
    }

    @Test
    void deleteVisibleTo_managerBypassesPendingCheck() {
        var auth = new TestingAuthenticationToken("M1", null, "ROLE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User manager = new User();
        manager.setId("M1");
        manager.setRole("[\"MANAGER\"]");
        when(userRepo.findByEmail("m@test.com")).thenReturn(Optional.of(manager));

        Absence a = new Absence();
        a.setId(101L);
        a.setUserId("U2");
        a.setStatus(AbsenceStatus.APPROVED);

        when(absenceRepo.findById(101L)).thenReturn(Optional.of(a));
        when(teamMemberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(10L));
        when(teamMemberRepo.existsByTeam_IdAndUser_Id(10L, "U2")).thenReturn(true);

        service.deleteVisibleTo("m@test.com", 101L);
        verify(absenceRepo).deleteById(101L);
    }

    @Test
    void deleteVisibleTo_shouldAllowAdminEvenIfNotPending() {
        var auth = new TestingAuthenticationToken("ADMIN", null, "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User admin = new User();
        admin.setRole("[\"ADMIN\"]");
        admin.setId("ADMIN");
        when(userRepo.findByEmail("a@test.com")).thenReturn(Optional.of(admin));

        Absence a = new Absence();
        a.setId(777L);
        a.setUserId("U2");
        a.setStatus(AbsenceStatus.APPROVED);

        when(absenceRepo.findById(777L)).thenReturn(Optional.of(a));

        service.deleteVisibleTo("a@test.com", 777L);
        verify(absenceRepo).deleteById(777L);
    }

    @Test
    void updateVisibleTo_shouldThrow_whenOwnerWithPendingButActuallyNotOwner() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User requester = new User();
        requester.setId("U1");
        requester.setEmail("me@test.com");
        requester.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(requester));

        Absence a = new Absence();
        a.setId(9999L);
        a.setUserId("U_OTHER"); // PAS le même user !
        a.setStatus(AbsenceStatus.PENDING); // PENDING mais pas owner
        when(absenceRepo.findById(9999L)).thenReturn(Optional.of(a));

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();

        // Ceci devrait lancer l'exception à la PREMIÈRE vérification (pas owner)
        assertThatThrownBy(() -> service.updateVisibleTo("me@test.com", 9999L, req))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("Forbidden");
    }

    @Test
    void deleteVisibleTo_shouldThrow_whenNotOwnerWithPendingStatus() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User requester = new User();
        requester.setId("U1");
        requester.setEmail("me@test.com");
        requester.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(requester));

        Absence a = new Absence();
        a.setId(9998L);
        a.setUserId("U_OTHER"); // PAS le même user !
        a.setStatus(AbsenceStatus.PENDING); // PENDING mais pas owner
        when(absenceRepo.findById(9998L)).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> service.deleteVisibleTo("me@test.com", 9998L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("Forbidden");
    }

    @Test
    void updateVisibleTo_shouldThrow_whenOwnerButStatusRejected() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User owner = new User();
        owner.setId("U1");
        owner.setEmail("me@test.com");
        owner.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(owner));

        Absence a = new Absence();
        a.setId(8888L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.REJECTED);
        when(absenceRepo.findById(8888L)).thenReturn(Optional.of(a));

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();

        assertThatThrownBy(() -> service.updateVisibleTo("me@test.com", 8888L, req))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("owner can edit only while PENDING");
    }

    @Test
    void deleteVisibleTo_shouldThrow_whenOwnerButStatusRejected() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User owner = new User();
        owner.setId("U1");
        owner.setEmail("me@test.com");
        owner.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(owner));

        Absence a = new Absence();
        a.setId(8887L);
        a.setUserId("U1");
        a.setStatus(AbsenceStatus.REJECTED);
        when(absenceRepo.findById(8887L)).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> service.deleteVisibleTo("me@test.com", 8887L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("owner can delete only while PENDING");
    }

    @Test
    void updateVisibleTo_shouldThrow_whenOwnerButStatusIsNull() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User owner = new User();
        owner.setId("U1");
        owner.setEmail("me@test.com");
        owner.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(owner));

        Absence a = new Absence();
        a.setId(7777L);
        a.setUserId("U1");
        a.setStatus(null);
        when(absenceRepo.findById(7777L)).thenReturn(Optional.of(a));

        AbsenceUpdateRequest req = new AbsenceUpdateRequest();

        assertThatThrownBy(() -> service.updateVisibleTo("me@test.com", 7777L, req))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("owner can edit only while PENDING");
    }

    @Test
    void deleteVisibleTo_shouldThrow_whenOwnerButStatusIsNull() {
        var auth = new TestingAuthenticationToken("U1", null, "ROLE_EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(auth);

        User owner = new User();
        owner.setId("U1");
        owner.setEmail("me@test.com");
        owner.setRole("[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(owner));

        Absence a = new Absence();
        a.setId(7776L);
        a.setUserId("U1");
        a.setStatus(null);
        when(absenceRepo.findById(7776L)).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> service.deleteVisibleTo("me@test.com", 7776L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("owner can delete only while PENDING");
    }

    @Test
    void listTeamAbsences_simple_shouldThrowWhenTeamIdNull() {
        assertThatThrownBy(() -> service.listTeamAbsences(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("teamId is required");
    }

    @Test
    void listTeamAbsences_simple_shouldReturnEmptyWhenNoUsers() {
        when(teamMemberRepo.findUsersByTeamId(5L)).thenReturn(List.of());

        var res = service.listTeamAbsences(5L);

        assertThat(res).isEmpty();
    }

    @Test
    void listTeamAbsences_simple_shouldReturnMappedAbsences() {
        User u1 = new User();
        u1.setId("U1");

        User u2 = new User();
        u2.setId("U2");

        when(teamMemberRepo.findUsersByTeamId(10L)).thenReturn(List.of(u1, u2));

        Absence abs = new Absence();
        abs.setId(50L);
        abs.setUserId("U1");

        when(absenceRepo.findByUserIdInOrderByStartDateDesc(List.of("U1", "U2")))
                .thenReturn(List.of(abs));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(50L))
                .thenReturn(List.of());

        var res = service.listTeamAbsences(10L);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).getId()).isEqualTo(50L);
    }

    @Test
    void listTeamAbsences_simple_shouldReturnEmptyWhenUsersIsNull() {
        when(teamMemberRepo.findUsersByTeamId(42L)).thenReturn(null);

        var res = service.listTeamAbsences(42L);

        assertThat(res).isEmpty();
    }

    private static User makeUser(String id) {
        User u = new User();
        u.setId(id);
        return u;
    }
}
