package com.example.time_manager.service;

import com.example.time_manager.dto.team.TeamDto;
import com.example.time_manager.model.Team;
import com.example.time_manager.model.TeamMember;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.TeamMemberRepository;
import com.example.time_manager.repository.TeamRepository;
import com.example.time_manager.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Business logic for Teams & Members with role-based access:
 *
 * - ADMIN: - can list all teams (allTeams) - can create/update/delete teams -
 * can add/remove team members everywhere
 *
 * - MANAGER (global role) AND member of the target team: - can add/remove
 * members in that team
 *
 * - EMPLOYEE (or any authenticated member of the target team): - can view team
 * members of their own teams
 *
 * - "MyTeams": teams where current user is a member (any role) -
 * "MyManagedTeams": teams where current user is a member AND has global MANAGER
 * role
 *
 * Notes: - User.role is stored as JSON String (e.g.
 * ["employee","manager","admin"]) - User.id is a String UUID (CHAR(36))
 */
@Service
@Transactional
public class TeamService {

    private final TeamRepository teamRepo;
    private final TeamMemberRepository teamMemberRepo;
    private final UserRepository userRepo;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public TeamService(TeamRepository teamRepo,
            TeamMemberRepository teamMemberRepo,
            UserRepository userRepo) {
        this.teamRepo = teamRepo;
        this.teamMemberRepo = teamMemberRepo;
        this.userRepo = userRepo;
    }

    /* ===================== Queries ===================== */
    /**
     * Public-ish list of teams (you can further restrict if needed).
     */
    public List<Team> findAll() {
        return teamRepo.findAll();
    }

    /**
     * Find a team by ID or throw 404.
     */
    public Team findById(Long id) {
        return teamRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Team not found: " + id));
    }

    /**
     * ADMIN-only: list all teams.
     */
    public List<Team> findAllForAdmin() {
        requireAdmin();
        return teamRepo.findAll();
    }

    /**
     * Teams where the current user is a member.
     */
    public List<Team> findTeamsOfCurrentUser() {
        String me = currentUserId();
        List<Long> teamIds = teamMemberRepo.findTeamIdsByUserId(me);
        return teamIds.isEmpty() ? List.of() : teamRepo.findAllById(teamIds);
    }

    /**
     * Teams where the current user is a member and has global MANAGER role. (We
     * reuse "myTeams" and simply require the MANAGER role.)
     */
    public List<Team> findManagedByCurrentUser() {
        requireRole("MANAGER");
        return findTeamsOfCurrentUser();
    }

    /**
     * List members of a given team. Allowed for ADMIN or any user who is a
     * member of that team.
     */
    public List<User> listMembers(Long teamId) {
        assertCanViewTeamMembers(teamId);
        return teamMemberRepo.findUsersByTeamId(teamId);
    }

    /**
     * Among a team's members, return the ones whose global role contains
     * "manager".
     */
    public List<User> listTeamManagers(Long teamId) {
        assertCanViewTeamMembers(teamId);
        List<User> members = teamMemberRepo.findUsersByTeamId(teamId);
        return members.stream().filter(u -> hasGlobalRole(u, "manager")).toList();
    }

    /* ===================== Mutations ===================== */
    /**
     * Create a team. ADMIN-only by default.
     */
    public Team create(@Valid TeamDto dto) {
        requireAdmin();
        Team t = new Team();
        t.setName(dto.getName());
        t.setDescription(dto.getDescription());
        return teamRepo.save(t);
    }

    /**
     * Update a team. ADMIN-only by default. If you want to allow MANAGER
     * members to update name/description, relax this check accordingly (e.g.,
     * assertCanManageTeamMembers(id)).
     */
    public Team update(Long id, @Valid TeamDto dto) {
        requireAdmin();
        Team t = findById(id);
        if (dto.getName() != null) {
            t.setName(dto.getName());
        }
        if (dto.getDescription() != null) {
            t.setDescription(dto.getDescription());
        }
        return teamRepo.save(t);
    }

    /**
     * Delete a team. ADMIN-only.
     */
    public void delete(Long id) {
        requireAdmin();
        if (!teamRepo.existsById(id)) {
            throw new EntityNotFoundException("Team not found: " + id);
        }
        teamRepo.deleteById(id);
    }

    /**
     * Add a member to a team. Allowed for ADMIN, or MANAGER who is also a
     * member of the team.
     */
    public void addMember(Long teamId, String userId) {
        assertCanManageTeamMembers(teamId);

        if (teamMemberRepo.existsByTeam_IdAndUser_Id(teamId, userId)) {
            return;
        }

        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new EntityNotFoundException("Team not found: " + teamId));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        TeamMember tm = new TeamMember();
        tm.setTeam(team); // uses relationship field, not primitive ID
        tm.setUser(user); // uses relationship field, not primitive ID
        teamMemberRepo.save(tm);
    }

    /**
     * Remove a member from a team. Allowed for ADMIN, or MANAGER who is also a
     * member of the team.
     */
    public void removeMember(Long teamId, String userId) {
        assertCanManageTeamMembers(teamId);
        if (!teamMemberRepo.existsByTeam_IdAndUser_Id(teamId, userId)) {
            return;
        }
        teamMemberRepo.deleteByTeam_IdAndUser_Id(teamId, userId);
    }

    /* ===================== AuthZ Helpers ===================== */
    private String currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new SecurityException("Unauthenticated");
        }
        String subject = auth.getName();
        if (subject.contains("@")) {
            return userRepo.findByEmail(subject)
                    .map(User::getId)
                    .orElseThrow(() -> new IllegalStateException("No user for email subject: " + subject));
        }

        // Otherwise assume subject is already the UUID
        return subject;
    }

    /**
     * True if current principal has ROLE_ADMIN.
     */
    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities() != null
                && auth.getAuthorities().stream()
                        .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    /**
     * True if current principal has ROLE_MANAGER.
     */
    private boolean isManager() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities() != null
                && auth.getAuthorities().stream()
                        .anyMatch(a -> "ROLE_MANAGER".equals(a.getAuthority()));
    }

    /**
     * Enforce ADMIN role.
     */
    private void requireAdmin() {
        if (!isAdmin()) {
            throw new SecurityException("Forbidden: requires ADMIN");
        }
    }

    /**
     * Enforce a given high-level role (expects upper-case like "MANAGER"). It
     * maps to Spring Security authorities prefixed with "ROLE_".
     */
    private void requireRole(String roleUpper) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) {
            throw new SecurityException("Unauthenticated");
        }
        String expected = "ROLE_" + roleUpper;
        boolean ok = auth.getAuthorities().stream()
                .anyMatch(a -> expected.equals(a.getAuthority()));
        if (!ok) {
            throw new SecurityException("Forbidden: requires " + expected);
        }
    }

    /**
     * Check if a user entity has a given global role (roles stored as JSON
     * string). Example JSON: ["employee","manager","admin"]
     */

    private boolean isMemberOf(Long teamId, String userId) { return teamMemberRepo.existsByTeam_IdAndUser_Id(teamId, userId); }

    private boolean hasGlobalRole(User u, String roleLower) {
        String roleRaw = u.getRole();
        if (roleRaw == null) {
            return false;
        }

        try {
            // Si c'est du JSON (ex: ["employee manager"] ou ["employee","manager"])
            java.util.List<String> roles = objectMapper.readValue(
                    roleRaw, new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {
            });
            return roles.stream()
                    .filter(java.util.Objects::nonNull)
                    .flatMap(r -> java.util.Arrays.stream(r.split("[\\s,;|]+")))
                    .anyMatch(t -> roleLower.equalsIgnoreCase(t));
        } catch (Exception ignore) {
            // Pas JSON -> on split directement
            return java.util.Arrays.stream(roleRaw.split("[\\s,;|]+"))
                    .anyMatch(t -> roleLower.equalsIgnoreCase(t));
        }
    }

    /**
     * Allow viewing team members if: - current user is ADMIN, or - current user
     * is a member of the team.
     */
    private void assertCanViewTeamMembers(Long teamId) {
        String me = currentUserId();
        if (isAdmin()) {
            return;
        }
        if (isMemberOf(teamId, me)) {
            return;
        }
        throw new SecurityException("Forbidden: not allowed to view members of this team");
    }

    /**
     * Allow managing team members if: - current user is ADMIN, or - current
     * user is MANAGER and a member of the team.
     */
    private void assertCanManageTeamMembers(Long teamId) {
        String me = currentUserId();
        if (isAdmin()) {
            return;
        }
        if (isManager() && isMemberOf(teamId, me)) {
            return;
        }
        throw new SecurityException("Forbidden: only ADMIN or MANAGER member of the team can modify members");
    }
}
