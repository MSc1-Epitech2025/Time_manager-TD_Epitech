package com.example.time_manager.controller;

import com.example.time_manager.dto.team.TeamDto;
import com.example.time_manager.dto.team.TeamMembersGroup;
import com.example.time_manager.graphql.controller.TeamController;
import com.example.time_manager.model.Team;
import com.example.time_manager.model.User;
import com.example.time_manager.service.TeamService;
import org.junit.jupiter.api.*;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TeamControllerTest {

    @Mock private TeamService teamService;
    private TeamController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        controller = new TeamController(teamService);
    }

    @Test
    void testTeams_ReturnsList() {
        List<Team> mockTeams = List.of(new Team(), new Team());
        when(teamService.findAll()).thenReturn(mockTeams);

        List<Team> result = controller.teams();

        assertEquals(2, result.size());
        verify(teamService).findAll();
    }

    @Test
    void testTeam_ReturnsById() {
        Team team = new Team();
        team.setId(10L);
        when(teamService.findById(10L)).thenReturn(team);

        Team result = controller.team(10L);

        assertEquals(10L, result.getId());
        verify(teamService).findById(10L);
    }

    @Test
    void testTeamMembers_ReturnsList() {
        List<User> members = List.of(new User(), new User());
        when(teamService.listMembers(5L)).thenReturn(members);

        List<User> result = controller.teamMembers(5L);

        assertEquals(2, result.size());
        verify(teamService).listMembers(5L);
    }

    @Test
    void testAllTeams_AdminQuery() {
        List<Team> mockTeams = List.of(new Team());
        when(teamService.findAllForAdmin()).thenReturn(mockTeams);

        List<Team> result = controller.allTeams();

        assertEquals(1, result.size());
        verify(teamService).findAllForAdmin();
    }

    @Test
    void testMyTeams() {
        List<Team> mockTeams = List.of(new Team(), new Team());
        when(teamService.findTeamsOfCurrentUser()).thenReturn(mockTeams);

        List<Team> result = controller.myTeams();

        assertEquals(2, result.size());
        verify(teamService).findTeamsOfCurrentUser();
    }

    @Test
    void testMyManagedTeams() {
        List<Team> mockTeams = List.of(new Team());
        when(teamService.findManagedByCurrentUser()).thenReturn(mockTeams);

        List<Team> result = controller.myManagedTeams();

        assertEquals(1, result.size());
        verify(teamService).findManagedByCurrentUser();
    }

    @Test
    void testTeamManagers() {
        List<User> mockManagers = List.of(new User());
        when(teamService.listTeamManagers(8L)).thenReturn(mockManagers);

        List<User> result = controller.teamManagers(8L);

        assertEquals(1, result.size());
        verify(teamService).listTeamManagers(8L);
    }

    @Test
    void testMyTeamMembers_BuildsGroupList() {
        Team t1 = new Team(); t1.setId(1L); t1.setName("Alpha");
        Team t2 = new Team(); t2.setId(2L); t2.setName("Beta");
        List<Team> myTeams = List.of(t1, t2);

        List<User> members1 = List.of(new User(), new User());
        List<User> members2 = List.of(new User());

        when(teamService.findTeamsOfCurrentUser()).thenReturn(myTeams);
        when(teamService.listMembers(1L)).thenReturn(members1);
        when(teamService.listMembers(2L)).thenReturn(members2);

        List<TeamMembersGroup> result = controller.myTeamMembers();

        assertEquals(2, result.size());
        assertEquals("Alpha", result.get(0).teamName());
        verify(teamService).listMembers(1L);
        verify(teamService).listMembers(2L);
    }

    @Test
    void testMembers_ResolvesFromService() {
        Team team = new Team();
        team.setId(99L);
        List<User> mockList = List.of(new User());

        when(teamService.listMembers(99L)).thenReturn(mockList);

        List<User> result = controller.members(team);

        assertEquals(1, result.size());
        verify(teamService).listMembers(99L);
    }

    @Test
    void testCreateTeam_Success() {
        TeamController.TeamInput input = new TeamController.TeamInput("Dev Team", "Developers group");
        Team expected = new Team();
        expected.setName("Dev Team");

        when(teamService.create(any(TeamDto.class))).thenReturn(expected);

        Team result = controller.createTeam(input);

        assertEquals("Dev Team", result.getName());
        verify(teamService).create(any(TeamDto.class));
    }

    @Test
    void testUpdateTeam_Success() {
        TeamController.TeamUpdateInput input =
                new TeamController.TeamUpdateInput(10L, "Ops Team", "Operations");
        Team updated = new Team();
        updated.setId(10L);
        updated.setName("Ops Team");

        when(teamService.update(eq(10L), any(TeamDto.class))).thenReturn(updated);

        Team result = controller.updateTeam(input);

        assertEquals(10L, result.getId());
        assertEquals("Ops Team", result.getName());
        verify(teamService).update(eq(10L), any(TeamDto.class));
    }

    @Test
    void testDeleteTeam_Success() {
        Boolean result = controller.deleteTeam(42L);

        assertTrue(result);
        verify(teamService).delete(42L);
    }

    @Test
    void testAddTeamMember_Success() {
        TeamController.MemberChangeInput input = new TeamController.MemberChangeInput("U123");

        Boolean result = controller.addTeamMember(5L, input);

        assertTrue(result);
        verify(teamService).addMember(5L, "U123");
    }

    @Test
    void testRemoveTeamMember_Success() {
        TeamController.MemberChangeInput input = new TeamController.MemberChangeInput("U123");

        Boolean result = controller.removeTeamMember(7L, input);

        assertTrue(result);
        verify(teamService).removeMember(7L, "U123");
    }
}
