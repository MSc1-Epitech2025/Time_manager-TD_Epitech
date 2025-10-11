package com.example.time_manager.controller;

import com.example.time_manager.dto.MemberChangeDto;
import com.example.time_manager.dto.TeamDto;
import com.example.time_manager.dto.UserSummary;
import com.example.time_manager.model.Team;
import com.example.time_manager.service.TeamService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) { this.teamService = teamService; }

    // ===== READ (auth requis)
    @GetMapping
    public List<TeamDto> list() {
        return teamService.findAll().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public TeamDto get(@PathVariable Long id) {
        return toDto(teamService.findById(id));
    }

    @GetMapping("/{id}/members")
    public List<UserSummary> members(@PathVariable Long id) {
        return teamService.listMembers(id).stream()
                .map(u -> new UserSummary(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail()))
                .toList();
    }

    // ===== WRITE (MANAGER/ADMIN)
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<TeamDto> create(@RequestBody @Valid TeamDto dto) {
        Team saved = teamService.create(dto);
        TeamDto body = toDto(saved);
        return ResponseEntity.created(URI.create("/api/teams/" + saved.getId())).body(body);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public TeamDto update(@PathVariable Long id, @RequestBody @Valid TeamDto dto) {
        return toDto(teamService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        teamService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<Void> addMember(@PathVariable Long id, @RequestBody @Valid MemberChangeDto body) {
        teamService.addMember(id, body.userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable String userId) {
        teamService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    private TeamDto toDto(Team t){
        TeamDto dto = new TeamDto();
        dto.id = t.getId();
        dto.name = t.getName();
        dto.description = t.getDescription();
        return dto;
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> notFound(EntityNotFoundException ex){
        return ResponseEntity.notFound().build();
    }
}
