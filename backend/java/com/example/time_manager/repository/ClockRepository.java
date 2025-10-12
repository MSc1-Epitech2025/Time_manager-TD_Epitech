package com.example.time_manager.repository;

import com.example.time_manager.model.Clock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClockRepository extends JpaRepository<Clock, Long> {
    List<Clock> findByUserIdAndAtBetweenOrderByAtAsc(String userId, Instant from, Instant to);
    List<Clock> findByUserIdOrderByAtDesc(String userId);
    Optional<Clock> findTopByUserIdOrderByAtDesc(String userId);
}
