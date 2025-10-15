package com.example.time_manager.repository;

import com.example.time_manager.model.TeamMember;
import com.example.time_manager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * JPA repository for TeamMember join-entity.
 *
 * This repository assumes TeamMember has relational fields:
 *   @ManyToOne Team team; // mapped to column team_id
 *   @ManyToOne User user; // mapped to column user_id (UUID CHAR(36))
 *
 * Therefore we use Spring Data's nested property syntax: Team_Id / User_Id
 * to generate queries based on the foreign key values.
 */
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    /** List memberships for a given team. */
    List<TeamMember> findByTeam_Id(Long teamId);

    /** Check if a user already belongs to a team. */
    boolean existsByTeam_IdAndUser_Id(Long teamId, String userId);

    /** Remove a membership by composite key (teamId, userId). */
    void deleteByTeam_IdAndUser_Id(Long teamId, String userId);

    /** Return the list of team IDs where the given user is a member. */
    @Query("select tm.team.id from TeamMember tm where tm.user.id = :userId")
    List<Long> findTeamIdsByUserId(String userId);

    /** Return the list of User entities that belong to a given team. */
    @Query("select tm.user from TeamMember tm where tm.team.id = :teamId")
    List<User> findUsersByTeamId(Long teamId);

    /** Find a specific membership entry. */
    Optional<TeamMember> findByTeam_IdAndUser_Id(Long teamId, String userId);
}
