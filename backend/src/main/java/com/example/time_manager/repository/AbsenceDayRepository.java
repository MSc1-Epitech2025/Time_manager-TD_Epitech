package com.example.time_manager.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.time_manager.model.absence.AbsenceDay;

@Repository
public interface AbsenceDayRepository extends JpaRepository<AbsenceDay, Long> {
  List<AbsenceDay> findByAbsence_IdOrderByAbsenceDateAsc(Long absenceId);
  void deleteByAbsence_Id(Long absenceId);
}
