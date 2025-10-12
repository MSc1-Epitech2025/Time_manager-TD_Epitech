package com.example.time_manager.service;

import com.example.time_manager.dto.team.TeamDto;
import com.example.time_manager.model.Team;
import com.example.time_manager.model.TeamMember;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.TeamMemberRepository;
import com.example.time_manager.repository.TeamRepository;
import com.example.time_manager.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TeamService {

    private final TeamRepository teamRepo;
    private final TeamMemberRepository memberRepo;
    private final UserRepository userRepo;

    public TeamService(TeamRepository teamRepo, TeamMemberRepository memberRepo, UserRepository userRepo) {
        this.teamRepo = teamRepo;
        this.memberRepo = memberRepo;
        this.userRepo = userRepo;
    }

    // CRUD teams
    @Transactional(readOnly = true)
    public List<Team> findAll() { return teamRepo.findAll(); }

    @Transactional(readOnly = true)
    public Team findById(Long id) {
        return teamRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Team not found: " + id));
    }

    public Team create(TeamDto dto) {
        Team t = new Team();
        t.setName(dto.name);
        t.setDescription(dto.description);
        return teamRepo.save(t);
    }

    public Team update(Long id, TeamDto dto) {
        Team t = findById(id);
        if (dto.name != null) t.setName(dto.name);
        if (dto.description != null) t.setDescription(dto.description);
        return teamRepo.save(t);
    }

    public void delete(Long id) {
        if (!teamRepo.existsById(id)) throw new EntityNotFoundException("Team not found: " + id);
        teamRepo.deleteById(id);
    }

    // Members
    public void addMember(Long teamId, String userId) {
        Team team = findById(teamId);
        User user = userRepo.findById(userId).orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        if (memberRepo.existsByTeamIdAndUserId(teamId, userId)) return;

        TeamMember tm = new TeamMember();
        tm.setTeam(team);
        tm.setUser(user);
        memberRepo.save(tm);
    }

    public void removeMember(Long teamId, String userId) {
        if (!teamRepo.existsById(teamId)) throw new EntityNotFoundException("Team not found: " + teamId);
        memberRepo.deleteByTeamIdAndUserId(teamId, userId);
    }

    @Transactional(readOnly = true)
    public List<User> listMembers(Long teamId) {
        if (!teamRepo.existsById(teamId)) throw new EntityNotFoundException("Team not found: " + teamId);
        return memberRepo.findByTeamId(teamId).stream().map(TeamMember::getUser).toList();
    }
}
