package com.example.time_manager.repository;

import com.example.time_manager.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
  List<Report> findAllByOrderByCreatedAtDesc();

  // "my reports"
  List<Report> findByAuthor_IdOrderByCreatedAtDesc(String authorId);

  // "reports for me" 
  List<Report> findByTarget_IdOrderByCreatedAtDesc(String targetId);
}
