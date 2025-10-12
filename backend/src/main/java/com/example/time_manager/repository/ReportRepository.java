package com.example.time_manager.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.time_manager.model.Report;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
  List<Report> findAllByOrderByCreatedAtDesc();
  List<Report> findByManager_IdOrderByCreatedAtDesc(String managerId);
}
