package com.example.time_manager.repository;

import com.example.time_manager.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

  List<Report> findAllByOrderByCreatedAtDesc();

  List<Report> findByAuthor_IdOrderByCreatedAtDesc(String authorId);

  List<Report> findByTarget_IdOrderByCreatedAtDesc(String targetId);
}
