package com.example.time_manager.repository;

import com.example.time_manager.model.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamId(Long teamId);
    boolean existsByTeamIdAndUserId(Long teamId, String userId);
    void deleteByTeamIdAndUserId(Long teamId, String userId);
}
