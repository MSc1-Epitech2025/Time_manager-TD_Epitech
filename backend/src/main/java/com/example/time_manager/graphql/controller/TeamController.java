package com.example.time_manager.graphql.controller;

import java.util.List;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.method.P;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import com.example.time_manager.dto.team.TeamDto;
import com.example.time_manager.dto.team.TeamMembersGroup;
import com.example.time_manager.model.Team;
import com.example.time_manager.model.User;
import com.example.time_manager.service.TeamService;

import jakarta.validation.Valid;

/**
 * GraphQL controller for Team & TeamMember operations.
 * - Exposes Queries: teams, team, teamMembers, allTeams, myTeams, myManagedTeams, teamManagers
 * - Exposes Mutations: createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember
 * - Field resolver: Team.members
 *
 * Security/authorization is enforced inside TeamService.
 */
@PreAuthorize("isAuthenticated()")
@Controller
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    /* ============================= QUERIES ============================= */

    /** List all teams (generic listing; service may not restrict) */
    @QueryMapping
    public List<Team> teams() {
        return teamService.findAll();
    }

    /** Fetch a single team by id */
    @QueryMapping
    public Team team(@Argument Long id) {
        return teamService.findById(id);
    }

    /** Members of a given team.
     *  Allowed to ADMIN or any member of that team (handled by service). */
    @QueryMapping
    public List<User> teamMembers(@Argument Long teamId) {
        return teamService.listMembers(teamId);
    }

    /** ADMIN-only: list all teams */
    @PreAuthorize("hasAuthority('ADMIN')")
    @QueryMapping
    public List<Team> allTeams() {
        return teamService.findAllForAdmin();
    }

    /** Teams where the current user is a member */
    @QueryMapping
    public List<Team> myTeams() {
        return teamService.findTeamsOfCurrentUser();
    }

    /** Teams where the current user is a member and has global MANAGER role */
    @QueryMapping
    public List<Team> myManagedTeams() {
        return teamService.findManagedByCurrentUser();
    }

    /** Managers (global role = manager) among the members of a given team */
    
    @QueryMapping
    public List<User> teamManagers(@Argument Long teamId) {
        return teamService.listTeamManagers(teamId);
    }

@PreAuthorize("isAuthenticated()")
@QueryMapping
public java.util.List<TeamMembersGroup> myTeamMembers() {
    var myTeams = teamService.findTeamsOfCurrentUser();
    var result = new java.util.ArrayList<TeamMembersGroup>(myTeams.size());
    for (var t : myTeams) {
        var members = teamService.listMembers(t.getId());
        result.add(new TeamMembersGroup(t.getId(), t.getName(), members));
    }
    return result;
}


    /* =========================== FIELD RESOLVER ======================== */

    /** Resolve Team.members via service (enforces view permissions). */
    @SchemaMapping(typeName = "Team", field = "members")
    public List<User> members(Team team) {
        return teamService.listMembers(team.getId());
    }

    /* ============================= MUTATIONS =========================== */

    /** Create a team (ADMIN by default). */
    @PreAuthorize("hasAuthority('ADMIN')")
    @MutationMapping
    public Team createTeam(@Argument @Valid TeamInput input) {
        TeamDto dto = new TeamDto();
        dto.setName(input.name());
        dto.setDescription(input.description());
        return teamService.create(dto);
    }

    /** Update a team (ADMIN by default). */
    @PreAuthorize("hasAuthority('ADMIN')")
    @MutationMapping
    public Team updateTeam(@Argument @Valid TeamUpdateInput input) {
        TeamDto dto = new TeamDto();
        dto.setId(input.id());
        dto.setName(input.name());
        dto.setDescription(input.description());
        return teamService.update(input.id(), dto); // service expects (id, dto)
    }

    /** Delete a team (ADMIN). */
    @PreAuthorize("hasAuthority('ADMIN')")
    @MutationMapping
    public Boolean deleteTeam(@Argument Long id) {
        teamService.delete(id);
        return true;
    }

    /** Add a user to a team (ADMIN or MANAGER who is member of that team). */
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('MANAGER') and @teamService.isCurrentUserMemberOfTeam(#teamId))")
    @MutationMapping
    public Boolean addTeamMember(@Argument Long teamId, @Argument @Valid MemberChangeInput input) {
        teamService.addMember(teamId, input.userId());
        return true;
    }

    /** Remove a user from a team (ADMIN or MANAGER who is member of that team). */
    @PreAuthorize("hasAuthority('ADMIN') or (hasAuthority('MANAGER') and @teamService.isCurrentUserMemberOfTeam(#teamId))")
    @MutationMapping
    public Boolean removeTeamMember(@Argument Long teamId, @Argument @Valid MemberChangeInput input) {
        teamService.removeMember(teamId, input.userId());
        return true;
    }

    /* ============================ INPUT RECORDS ======================== */
    // Records used to bind GraphQL inputs to Java

    public record TeamInput(String name, String description) {}
    public record TeamUpdateInput(Long id, String name, String description) {}
    public record MemberChangeInput(String userId) {}
}
