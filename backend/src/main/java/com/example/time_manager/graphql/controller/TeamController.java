package com.example.time_manager.graphql.controller;

import com.example.time_manager.dto.team.TeamDto;
import com.example.time_manager.dto.team.MemberChangeDto;
import com.example.time_manager.model.Team;
import com.example.time_manager.model.User;
import com.example.time_manager.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.*;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    /* =================== QUERIES =================== */

    @QueryMapping
    public List<Team> teams() {
        return teamService.findAll();
    }

    @QueryMapping
    public Team team(@Argument Long id) {
        return teamService.findById(id);
    }

    // Optionnel si tu veux une query dédiée (sinon le field resolver ci-dessous suffit)
    @QueryMapping
    public List<User> teamMembers(@Argument Long teamId) {
        return teamService.listMembers(teamId);
    }

    /* ============== FIELD RESOLVER ============== */
    @SchemaMapping(typeName = "Team", field = "members")
    public List<User> members(Team team) {
        return teamService.listMembers(team.getId());
    }

    @MutationMapping
    public Team createTeam(@Argument @Valid TeamInput input) {
        TeamDto dto = new TeamDto();
        dto.name = input.name();
        dto.description = input.description();
        return teamService.create(dto);
    }

    @MutationMapping
    public Team updateTeam(@Argument @Valid TeamUpdateInput input) {
        TeamDto dto = new TeamDto();
        dto.id = input.id();              
        dto.name = input.name();
        dto.description = input.description();
        return teamService.update(input.id(), dto); 
    }

    @MutationMapping
    public Boolean deleteTeam(@Argument Long id) {
        teamService.delete(id);
        return true;
    }

    @MutationMapping
    public Boolean addTeamMember(@Argument Long teamId, @Argument @Valid MemberChangeInput input) {
        MemberChangeDto dto = new MemberChangeDto();
        dto.userId = input.userId();
        teamService.addMember(teamId, dto.userId);
        return true;
    }

    @MutationMapping
    public Boolean removeTeamMember(@Argument Long teamId, @Argument @Valid MemberChangeInput input) {
        MemberChangeDto dto = new MemberChangeDto();
        dto.userId = input.userId();
        teamService.removeMember(teamId, dto.userId);
        return true;
    }

    public record TeamInput(String name, String description) {}
    public record TeamUpdateInput(Long id, String name, String description) {}
    public record MemberChangeInput(String userId) {}
}
