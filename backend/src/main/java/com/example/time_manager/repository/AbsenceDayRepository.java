package com.example.time_manager.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.time_manager.model.absence.AbsenceDay;

@Repository
public interface AbsenceDayRepository extends JpaRepository<AbsenceDay, Long> {

  @Query("select d from AbsenceDay d where d.absence.id = :absenceId order by d.absenceDate asc")
  List<AbsenceDay> findByAbsenceIdOrderByAbsenceDateAsc(@Param("absenceId") Long absenceId);

  @Modifying
  @Query("delete from AbsenceDay d where d.absence.id = :absenceId")
  void deleteByAbsenceId(@Param("absenceId") Long absenceId);
}
