package com.example.time_manager.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.time_manager.model.Clock;

@Repository
public interface ClockRepository extends JpaRepository<Clock, Long> {

    List<Clock> findByUser_IdAndAtBetweenOrderByAtAsc(
        String userId,
        Instant from,
        Instant to
    );

    List<Clock> findByUser_IdOrderByAtDesc(String userId);

    Optional<Clock> findTopByUser_IdOrderByAtDescIdDesc(String userId);
}
