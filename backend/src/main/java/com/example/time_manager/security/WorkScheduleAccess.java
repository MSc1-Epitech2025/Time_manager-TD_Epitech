package com.example.time_manager.security;

import com.example.time_manager.model.User;
import com.example.time_manager.repository.TeamMemberRepository;
import com.example.time_manager.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WorkScheduleAccess {

  private final UserRepository userRepo;
  private final TeamMemberRepository teamMemberRepo;

  public WorkScheduleAccess(UserRepository userRepo, TeamMemberRepository teamMemberRepo) {
    this.userRepo = userRepo;
    this.teamMemberRepo = teamMemberRepo;
  }

  public void assertCanSelfManage(String userId) {
    if (!(isAdmin(userId) || isManager(userId))) {
      throw new AccessDeniedException("Only MANAGER or ADMIN can update their own schedule.");
    }
  }

  public void assertCanManage(String actorUserId, String targetUserId) {
    if (actorUserId == null || targetUserId == null) {
      throw new AccessDeniedException("Invalid users");
    }
    if (actorUserId.equals(targetUserId)) {
      assertCanSelfManage(actorUserId);
      return;
    }
    if (isAdmin(actorUserId)) return;

    if (isManager(actorUserId) && shareTeamSafe(actorUserId, targetUserId)) return;

    throw new AccessDeniedException("You are not allowed to modify this user's schedule.");
  }

  private boolean shareTeamSafe(String userA, String userB) {
    List<Long> managerTeamIds = teamMemberRepo.findTeamIdsByUserId(userA);
    if (managerTeamIds.isEmpty()) return false;
    for (Long teamId : managerTeamIds) {
      if (teamMemberRepo.existsByTeam_IdAndUser_Id(teamId, userB)) {
        return true;
      }
    }
    return false;
  }

  private boolean isAdmin(String userId) {
    return userRepo.findById(userId)
        .map(User::getRole)
        .map(String::toLowerCase)
        .map(s -> s.contains("admin"))
        .orElse(false);
  }

  private boolean isManager(String userId) {
    return userRepo.findById(userId)
        .map(User::getRole)
        .map(String::toLowerCase)
        .map(s -> s.contains("manager"))
        .orElse(false);
  }
}
