package com.example.time_manager.repository;

import java.util.List;
import java.util.Optional;

import com.example.time_manager.model.TeamMember;
import com.example.time_manager.model.User;
import com.example.time_manager.model.absence.Absence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

  List<TeamMember> findByTeam_Id(Long teamId);
  boolean existsByTeam_IdAndUser_Id(Long teamId, String userId);
  void deleteByTeam_IdAndUser_Id(Long teamId, String userId);
  Optional<TeamMember> findByTeam_IdAndUser_Id(Long teamId, String userId);

  @Query("select tm.team.id from TeamMember tm where tm.user.id = :userId")
  List<Long> findTeamIdsByUserId(@Param("userId") String userId);

  @Query("select tm.user from TeamMember tm where tm.team.id = :teamId")
  List<User> findUsersByTeamId(@Param("teamId") Long teamId);

  @Query("select tm.user.id from TeamMember tm where tm.team.id = :teamId")
  List<String> findUserIdsByTeamId(@Param("teamId") Long teamId);

}
