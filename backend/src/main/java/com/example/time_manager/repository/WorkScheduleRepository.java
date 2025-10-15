package com.example.time_manager.repository;


import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;
import com.example.time_manager.model.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Optional;


@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, Long> {
List<WorkSchedule> findByUserId(String userId);
Optional<WorkSchedule> findByUserIdAndDayOfWeekAndPeriod(String userId, WorkDay dayOfWeek, WorkPeriod period);
void deleteByUserId(String userId);
}