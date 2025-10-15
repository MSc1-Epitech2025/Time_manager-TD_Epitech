package com.example.time_manager.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.time_manager.model.Team;

public interface TeamRepository extends JpaRepository<Team, Long> {

}
