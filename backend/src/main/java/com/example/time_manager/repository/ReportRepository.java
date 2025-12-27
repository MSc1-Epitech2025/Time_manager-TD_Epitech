package com.example.time_manager.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.time_manager.model.Report;

public interface ReportRepository extends JpaRepository<Report, Long> {

  boolean existsByRuleKey(String ruleKey);

  List<Report> findAllByOrderByCreatedAtDesc();

  List<Report> findByAuthor_IdOrderByCreatedAtDesc(String authorId);

  List<Report> findByTarget_IdOrderByCreatedAtDesc(String targetId);
}
