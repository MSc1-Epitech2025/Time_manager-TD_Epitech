package com.example.time_manager.services;

import com.example.time_manager.dto.team.TeamDto;
import com.example.time_manager.model.Team;
import com.example.time_manager.model.TeamMember;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.TeamMemberRepository;
import com.example.time_manager.repository.TeamRepository;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.TeamService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class TeamServiceTest {

    TeamRepository teamRepo = mock(TeamRepository.class);
    TeamMemberRepository memberRepo = mock(TeamMemberRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    TeamService service = new TeamService(teamRepo, memberRepo, userRepo);

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void findAll_shouldReturnList() {
        when(teamRepo.findAll()).thenReturn(List.of(new Team()));
        assertThat(service.findAll()).hasSize(1);
    }

    @Test
    void findById_shouldReturn_whenExists() {
        Team t = new Team();
        t.setId(1L);
        when(teamRepo.findById(1L)).thenReturn(Optional.of(t));
        assertThat(service.findById(1L).getId()).isEqualTo(1L);
    }

    @Test
    void findById_shouldThrow_whenNotFound() {
        when(teamRepo.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findById(9L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void findAllForAdmin_shouldWork_whenAdmin() {
        setAuth("A", "ROLE_ADMIN");
        when(teamRepo.findAll()).thenReturn(List.of(new Team()));
        assertThat(service.findAllForAdmin()).hasSize(1);
    }

    @Test
    void findAllForAdmin_shouldThrow_whenNotAdmin() {
        setAuth("E", "ROLE_EMPLOYEE");
        assertThatThrownBy(() -> service.findAllForAdmin())
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("ADMIN");
    }

    @Test
    void findTeamsOfCurrentUser_shouldReturnList() {
        setAuth("U1");
        when(memberRepo.findTeamIdsByUserId("U1")).thenReturn(List.of(10L, 20L));
        when(teamRepo.findAllById(List.of(10L, 20L))).thenReturn(List.of(new Team(), new Team()));
        assertThat(service.findTeamsOfCurrentUser()).hasSize(2);
    }

    @Test
    void findTeamsOfCurrentUser_shouldReturnEmpty_whenNoTeams() {
        setAuth("U1");
        when(memberRepo.findTeamIdsByUserId("U1")).thenReturn(List.of());
        assertThat(service.findTeamsOfCurrentUser()).isEmpty();
    }

    @Test
    void findManagedByCurrentUser_shouldRequireManager() {
        setAuth("M1", "ROLE_MANAGER");
        when(memberRepo.findTeamIdsByUserId("M1")).thenReturn(List.of(1L));
        when(teamRepo.findAllById(List.of(1L))).thenReturn(List.of(new Team()));
        assertThat(service.findManagedByCurrentUser()).hasSize(1);
    }

    @Test
    void findManagedByCurrentUser_shouldThrow_ifNotManager() {
        setAuth("E1", "ROLE_EMPLOYEE");
        assertThatThrownBy(() -> service.findManagedByCurrentUser())
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("MANAGER");
    }

    @Test
    void listMembers_shouldAllowAdmin() {
        setAuth("A1", "ROLE_ADMIN");
        when(memberRepo.findUsersByTeamId(5L)).thenReturn(List.of(new User()));
        assertThat(service.listMembers(5L)).hasSize(1);
    }

    @Test
    void listMembers_shouldAllowMember() {
        setAuth("U1");
        when(memberRepo.existsByTeam_IdAndUser_Id(5L, "U1")).thenReturn(true);
        when(memberRepo.findUsersByTeamId(5L)).thenReturn(List.of(new User()));
        assertThat(service.listMembers(5L)).hasSize(1);
    }

    @Test
    void listMembers_shouldThrow_ifNotMemberOrAdmin() {
        setAuth("U2");
        when(memberRepo.existsByTeam_IdAndUser_Id(5L, "U2")).thenReturn(false);
        assertThatThrownBy(() -> service.listMembers(5L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void listTeamManagers_shouldFilterProperly() {
        setAuth("U1");
        when(memberRepo.existsByTeam_IdAndUser_Id(5L, "U1")).thenReturn(true);

        User m = new User();
        m.setRole("[\"manager\"]");
        User e = new User();
        e.setRole("[\"employee\"]");
        when(memberRepo.findUsersByTeamId(5L)).thenReturn(List.of(m, e));

        var res = service.listTeamManagers(5L);
        assertThat(res).hasSize(1);
    }

    @Test
    void create_shouldWork_forAdmin() {
        setAuth("A", "ROLE_ADMIN");
        TeamDto dto = new TeamDto();
        dto.setName("T");
        Team t = new Team();
        t.setId(1L);
        when(teamRepo.save(any())).thenReturn(t);
        assertThat(service.create(dto).getId()).isEqualTo(1L);
    }

    @Test
    void create_shouldThrow_ifNotAdmin() {
        setAuth("E1", "ROLE_EMPLOYEE");
        TeamDto dto = new TeamDto();
        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void update_shouldChangeFields_forAdmin() {
        setAuth("A", "ROLE_ADMIN");
        TeamDto dto = new TeamDto();
        dto.setName("New");
        dto.setDescription("Desc");

        Team t = new Team();
        t.setId(5L);
        when(teamRepo.findById(5L)).thenReturn(Optional.of(t));
        when(teamRepo.save(any())).thenReturn(t);

        Team res = service.update(5L, dto);
        assertThat(res.getName()).isEqualTo("New");
    }

    @Test
    void update_shouldThrow_ifNotAdmin() {
        setAuth("U", "ROLE_EMPLOYEE");
        assertThatThrownBy(() -> service.update(1L, new TeamDto()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void delete_shouldWork_forAdmin() {
        setAuth("A", "ROLE_ADMIN");
        when(teamRepo.existsById(1L)).thenReturn(true);
        service.delete(1L);
        verify(teamRepo).deleteById(1L);
    }

    @Test
    void delete_shouldThrow_ifNotFound() {
        setAuth("A", "ROLE_ADMIN");
        when(teamRepo.existsById(9L)).thenReturn(false);
        assertThatThrownBy(() -> service.delete(9L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void delete_shouldThrow_ifNotAdmin() {
        setAuth("U", "ROLE_EMPLOYEE");
        assertThatThrownBy(() -> service.delete(1L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void addMember_shouldWork_forAdmin() {
        setAuth("A", "ROLE_ADMIN");
        Team team = new Team();
        team.setId(1L);
        User user = new User();
        user.setId("U1");
        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(userRepo.findById("U1")).thenReturn(Optional.of(user));

        service.addMember(1L, "U1");
        verify(memberRepo).save(any(TeamMember.class));
    }

    @Test
    void addMember_shouldSkip_ifAlreadyExists() {
        setAuth("A", "ROLE_ADMIN");
        when(memberRepo.existsByTeam_IdAndUser_Id(1L, "U1")).thenReturn(true);
        service.addMember(1L, "U1");
        verifyNoInteractions(teamRepo);
    }

    @Test
    void addMember_shouldThrow_ifTeamNotFound() {
        setAuth("A", "ROLE_ADMIN");
        when(teamRepo.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.addMember(1L, "U1"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void addMember_shouldThrow_ifUserNotFound() {
        setAuth("A", "ROLE_ADMIN");
        Team team = new Team();
        team.setId(1L);
        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(userRepo.findById("U1")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.addMember(1L, "U1"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void removeMember_shouldWork_forAdmin() {
        setAuth("A", "ROLE_ADMIN");
        when(memberRepo.existsByTeam_IdAndUser_Id(1L, "U1")).thenReturn(true);
        service.removeMember(1L, "U1");
        verify(memberRepo).deleteByTeam_IdAndUser_Id(1L, "U1");
    }

    @Test
    void removeMember_shouldSkip_ifNotExists() {
        setAuth("A", "ROLE_ADMIN");
        when(memberRepo.existsByTeam_IdAndUser_Id(1L, "U1")).thenReturn(false);
        service.removeMember(1L, "U1");
        verify(memberRepo, never()).deleteByTeam_IdAndUser_Id(any(), any());
    }

    @Test
    void addOrRemove_shouldThrow_ifManagerNotMember() {
        setAuth("M1", "ROLE_MANAGER");
        when(memberRepo.existsByTeam_IdAndUser_Id(1L, "M1")).thenReturn(false);
        assertThatThrownBy(() -> service.addMember(1L, "U1"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("only ADMIN or MANAGER");
    }

    @Test
    void currentUserId_shouldResolveEmailToId() {
        User u = new User();
        u.setId("U1");
        when(userRepo.findByEmail("user@test.com")).thenReturn(Optional.of(u));
        setAuth("user@test.com");
        assertThat(service.findTeamsOfCurrentUser()).isEmpty();
    }

    @Test
    void currentUserId_shouldThrow_ifNoAuth() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> service.findTeamsOfCurrentUser())
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void hasGlobalRole_shouldHandlePlainString() throws Exception {
        User u = new User();
        u.setRole("manager,employee");
        var m = TeamService.class.getDeclaredMethod("hasGlobalRole", User.class, String.class);
        m.setAccessible(true);
        assertThat((boolean) m.invoke(service, u, "manager")).isTrue();
    }

    @Test
    void isCurrentUserMemberOfTeam_shouldDelegateToRepo() {
        setAuth("U1");
        when(memberRepo.existsByTeam_IdAndUser_Id(5L, "U1")).thenReturn(true);
        assertThat(service.isCurrentUserMemberOfTeam(5L)).isTrue();
        verify(memberRepo).existsByTeam_IdAndUser_Id(5L, "U1");
    }

    @Test
    void requireRole_shouldThrow_ifMissingAuthority() throws Exception {
        setAuth("E1", "ROLE_EMPLOYEE");
        var method = TeamService.class.getDeclaredMethod("requireRole", String.class);
        method.setAccessible(true);

        try {
            method.invoke(service, "MANAGER");
            fail("Expected AccessDeniedException");
        } catch (java.lang.reflect.InvocationTargetException e) {
            Throwable cause = e.getCause();
            assertThat(cause)
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("MANAGER");
        }
    }

    @Test
    void hasAnyAuthority_shouldReturnFalse_whenAuthIsNullOrEmpty() throws Exception {
        var method = TeamService.class.getDeclaredMethod("hasAnyAuthority", org.springframework.security.core.Authentication.class, String[].class);
        method.setAccessible(true);

        boolean res1 = (boolean) method.invoke(null, (Object) null, new String[]{"ADMIN"});
        assertThat(res1).isFalse();

        var auth = new TestingAuthenticationToken("U", null);
        auth.setAuthenticated(true);
        boolean res2 = (boolean) method.invoke(null, auth, new String[]{"ADMIN"});
        assertThat(res2).isFalse();
    }

    @Test
    void addMember_shouldWork_whenManagerMember() {
        setAuth("M1", "ROLE_MANAGER");
        when(memberRepo.existsByTeam_IdAndUser_Id(1L, "M1")).thenReturn(true);

        Team team = new Team();
        team.setId(1L);
        User user = new User();
        user.setId("U2");

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(userRepo.findById("U2")).thenReturn(Optional.of(user));

        service.addMember(1L, "U2");
        verify(memberRepo).save(any(TeamMember.class));
    }

    @Test
    void removeMember_shouldWork_whenManagerMember() {
        setAuth("M1", "ROLE_MANAGER");
        when(memberRepo.existsByTeam_IdAndUser_Id(1L, "M1")).thenReturn(true);
        when(memberRepo.existsByTeam_IdAndUser_Id(1L, "U2")).thenReturn(true);
        service.removeMember(1L, "U2");
        verify(memberRepo).deleteByTeam_IdAndUser_Id(1L, "U2");
    }

    @Test
    void hasGlobalRole_shouldReturnFalse_whenRoleIsNull() throws Exception {
        User u = new User();
        u.setRole(null);
        var m = TeamService.class.getDeclaredMethod("hasGlobalRole", User.class, String.class);
        m.setAccessible(true);
        boolean result = (boolean) m.invoke(service, u, "manager");
        assertThat(result).isFalse();
    }

    @Test
    void update_shouldSkipNullFields() {
        setAuth("A", "ROLE_ADMIN");

        TeamDto dto = new TeamDto();
        dto.setName(null);
        dto.setDescription(null);

        Team t = new Team();
        t.setId(5L);
        t.setName("OLD");
        t.setDescription("OLD_DESC");

        when(teamRepo.findById(5L)).thenReturn(Optional.of(t));
        when(teamRepo.save(any())).thenReturn(t);

        Team res = service.update(5L, dto);

        assertThat(res.getName()).isEqualTo("OLD");
        assertThat(res.getDescription()).isEqualTo("OLD_DESC");
    }

    @Test
    void currentUserId_shouldThrow_ifAuthNameIsNull() {
        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn(null);
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertThatThrownBy(() -> service.findTeamsOfCurrentUser())
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Unauthenticated");
    }

    @Test
    void addMember_shouldWork_forManagerMember_directBranch() {
        setAuth("M1", "ROLE_MANAGER");

        when(memberRepo.existsByTeam_IdAndUser_Id(1L, "M1"))
                .thenReturn(true);

        Team team = new Team();
        team.setId(1L);
        User user = new User();
        user.setId("U9");

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(userRepo.findById("U9")).thenReturn(Optional.of(user));

        service.addMember(1L, "U9");

        verify(memberRepo).save(any(TeamMember.class));
    }

    @Test
    void hasAnyAuthority_shouldReturnFalse_whenAuthoritiesNull() throws Exception {
        var method = TeamService.class.getDeclaredMethod(
                "hasAnyAuthority",
                org.springframework.security.core.Authentication.class,
                String[].class
        );
        method.setAccessible(true);

        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getAuthorities()).thenReturn(null); // <-- branche non couverte

        boolean result = (boolean) method.invoke(null, auth, new String[]{"ADMIN"});

        assertThat(result).isFalse();
    }

    private static void setAuth(String userId, String... roles) {
        var auth = new TestingAuthenticationToken(userId, null, roles);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
