package com.example.time_manager.service;

import com.example.time_manager.dto.report.ReportCreateRequest;
import com.example.time_manager.dto.report.ReportResponse;
import com.example.time_manager.dto.report.ReportUpdateRequest;
import com.example.time_manager.model.Report;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.ReportRepository;
import com.example.time_manager.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ReportService {

  private final ReportRepository reportRepo;
  private final UserRepository userRepo;

  public ReportService(ReportRepository reportRepo, UserRepository userRepo) {
    this.reportRepo = reportRepo;
    this.userRepo = userRepo;
  }

  @Transactional(readOnly = true)
  public List<ReportResponse> listAll() {
    return reportRepo.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public List<ReportResponse> listForManagerEmail(String managerEmail) {
    User m = userRepo.findByEmail(managerEmail).orElseThrow(() -> new EntityNotFoundException("Manager not found"));
    return reportRepo.findByManager_IdOrderByCreatedAtDesc(m.getId()).stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public ReportResponse get(Long id) {
    return toDto(reportRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Report not found: " + id)));
  }

  public ReportResponse create(ReportCreateRequest req) {
    Report r = new Report();
    r.setTitle(req.title);
    r.setBody(req.body);
    if (req.managerId != null && !req.managerId.isBlank()) {
      r.setManager(userRepo.findById(req.managerId).orElseThrow(() -> new EntityNotFoundException("Manager not found: " + req.managerId)));
    }
    r = reportRepo.save(r);
    return toDto(r);
  }

  public ReportResponse update(Long id, ReportUpdateRequest req) {
    Report r = reportRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Report not found: " + id));
    if (req.title != null) r.setTitle(req.title);
    if (req.body != null)  r.setBody(req.body);
    if (req.managerId != null) {
      if (req.managerId.isBlank()) {
        r.setManager(null);
      } else {
        r.setManager(userRepo.findById(req.managerId).orElseThrow(() -> new EntityNotFoundException("Manager not found: " + req.managerId)));
      }
    }
    r = reportRepo.save(r);
    return toDto(r);
  }

  public void delete(Long id) {
    if (!reportRepo.existsById(id)) throw new EntityNotFoundException("Report not found: " + id);
    reportRepo.deleteById(id);
  }

  private ReportResponse toDto(Report r) {
    var dto = new ReportResponse();
    dto.id = r.getId();
    dto.title = r.getTitle();
    dto.body = r.getBody();
    dto.createdAt = r.getCreatedAt();
    dto.managerId = r.getManager() != null ? r.getManager().getId() : null;
    dto.managerEmail = r.getManager() != null ? r.getManager().getEmail() : null;
    return dto;
  }
}
