package com.example.time_manager.services.absence;

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
import java.util.*;

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
        a.setStartDate(LocalDate.of(2025,1,1));
        a.setEndDate(LocalDate.of(2025,1,2));
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
    void listForUser_shouldThrowIfForbidden() {
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
    void getVisibleTo_shouldReturnForAdminOrOwnerOrManager() {
        User requester = new User();
        requester.setId("U_ADMIN");
        requester.setEmail("admin@test.com");
        requester.setRole("[\"ADMIN\"]");

        Absence a = new Absence();
        a.setId(77L);
        a.setUserId("U_OWNER");

        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(requester));
        when(absenceRepo.findById(77L)).thenReturn(Optional.of(a));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(77L)).thenReturn(List.of());

        var res = service.getVisibleTo("admin@test.com", 77L);
        assertThat(res.getId()).isEqualTo(77L);
    }

    @Test
    void getVisibleTo_shouldThrow_ifNotAllowed() {
        User requester = new User();
        requester.setId("U_NO");
        requester.setEmail("no@test.com");
        requester.setRole("[\"EMPLOYEE\"]");

        Absence a = new Absence();
        a.setId(99L);
        a.setUserId("U_OTHER");

        when(userRepo.findByEmail("no@test.com")).thenReturn(Optional.of(requester));
        when(absenceRepo.findById(99L)).thenReturn(Optional.of(a));

        assertThatThrownBy(() -> service.getVisibleTo("no@test.com", 99L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
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

        when(absenceRepo.findByUserIdInOrderByStartDateDesc(List.of("U1","U2")))
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

        when(absenceRepo.findByUserIdInOrderByStartDateDesc(List.of("U1","U2")))
                .thenReturn(List.of(abs));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(100L)).thenReturn(List.of());

        var res = service.listTeamAbsences("manager@test.com", null);

        assertThat(res).hasSize(1);
    }

    private static User makeUser(String id) {
        User u = new User();
        u.setId(id);
        return u;
    }
}
