package com.example.time_manager.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.time_manager.model.absence.Absence;

@Repository
public interface AbsenceRepository extends JpaRepository<Absence, Long> {

  List<Absence> findByUserIdOrderByStartDateDesc(String userId);

  List<Absence> findAllByOrderByStartDateDesc();

  List<Absence> findByUserIdInOrderByStartDateDesc(List<String> userIds);
}
