package com.example.time_manager.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;
import com.example.time_manager.model.WorkSchedule;

@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, Long> {

  // Custom method to find all WorkSchedules for a user, ordered by day of week and period
  List<WorkSchedule> findByUser_IdOrderByDayOfWeekAscPeriodAsc(String userId);
  // Custom method to find a WorkSchedule by user ID, day of week, and period
  Optional<WorkSchedule> findByUser_IdAndDayOfWeekAndPeriod(String userId, WorkDay day, WorkPeriod period);
  // Custom method to delete a WorkSchedule by user ID, day of week, and period
  void deleteByUser_IdAndDayOfWeekAndPeriod(String userId, WorkDay day, WorkPeriod period);
}
