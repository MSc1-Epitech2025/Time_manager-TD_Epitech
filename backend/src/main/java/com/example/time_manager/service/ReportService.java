package com.example.time_manager.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.time_manager.dto.report.ReportCreateRequest;
import com.example.time_manager.dto.report.ReportResponse;
import com.example.time_manager.dto.report.ReportUpdateRequest;
import com.example.time_manager.model.Report;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.ReportRepository;
import com.example.time_manager.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

/**
 * Business logic for Reports:
 * - Any authenticated user can create a report to ANY target user
 * - Author can update/delete their own reports; ADMIN can manage all
 * - Visibility: a report is visible to its author, its target, or an ADMIN
 */
@Service
@Transactional
public class ReportService {

  private final ReportRepository reportRepo;
  private final UserRepository userRepo;

  public ReportService(ReportRepository reportRepo, UserRepository userRepo) {
    this.reportRepo = reportRepo;
    this.userRepo = userRepo;
  }

  /* ======================== CREATE ======================== */

  public ReportResponse createForAuthorEmail(String authorEmail, ReportCreateRequest req) {
    User author = userByEmail(authorEmail);

    User target = userRepo.findById(req.getTargetUserId())
        .orElseThrow(() -> new EntityNotFoundException("Target user not found: " + req.getTargetUserId()));

    Report r = new Report();
    r.setAuthor(author);
    r.setTarget(target);

    if (req.getSubjectUserId() != null && !req.getSubjectUserId().isBlank()) {
      User subject = userRepo.findById(req.getSubjectUserId())
          .orElseThrow(() -> new EntityNotFoundException("Subject user not found: " + req.getSubjectUserId()));
      r.setSubject(subject);
    }

    r.setType("MANUAL");
    r.setSeverity("INFO");
    r.setRuleKey(null);

    r.setTitle(req.getTitle());
    r.setBody(req.getBody());

    r = reportRepo.save(r);
    return toDto(r);
  }

  /* ======================== READ ======================== */

  @Transactional(readOnly = true)
  public List<ReportResponse> listAllForAdmin(String email) {
    User me = userByEmail(email);
    requireAdmin(me);

    return reportRepo.findAllByOrderByCreatedAtDesc()
        .stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public List<ReportResponse> listAuthoredByEmail(String email) {
    User me = userByEmail(email);
    return reportRepo.findByAuthor_IdOrderByCreatedAtDesc(me.getId())
        .stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public List<ReportResponse> listReceivedByEmail(String email) {
    User me = userByEmail(email);
    return reportRepo.findByTarget_IdOrderByCreatedAtDesc(me.getId())
        .stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public ReportResponse getVisibleTo(String email, Long id) {
    Report r = reportRepo.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Report not found: " + id));

    User me = userByEmail(email);

    if (isAdmin(me) || isAuthor(me, r) || isTarget(me, r)) {
      return toDto(r);
    }

    throw new AccessDeniedException("Forbidden");
  }

  /* ======================== UPDATE / DELETE ======================== */

  public ReportResponse updateVisibleTo(String email, Long id, ReportUpdateRequest req) {
    Report r = reportRepo.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Report not found: " + id));

    User me = userByEmail(email);

    if (!(isAdmin(me) || isAuthor(me, r))) {
      throw new AccessDeniedException("Forbidden");
    }

    if (req.getTitle() != null) r.setTitle(req.getTitle());
    if (req.getBody() != null)  r.setBody(req.getBody());

    r = reportRepo.save(r);
    return toDto(r);
  }

  public void deleteVisibleTo(String email, Long id) {
    Report r = reportRepo.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Report not found: " + id));

    User me = userByEmail(email);

    if (!(isAdmin(me) || isAuthor(me, r))) {
      throw new AccessDeniedException("Forbidden");
    }

    reportRepo.deleteById(id);
  }

  /* ======================== Mapping ======================== */

  private ReportResponse toDto(Report r) {
    ReportResponse dto = new ReportResponse();

    dto.setId(r.getId());
    dto.setTitle(r.getTitle());
    dto.setBody(r.getBody());
    dto.setCreatedAt(r.getCreatedAt());
    dto.setUpdatedAt(r.getUpdatedAt());

    dto.setAuthorId(r.getAuthor().getId());
    dto.setAuthorEmail(r.getAuthor().getEmail());

    dto.setTargetUserId(r.getTarget().getId());
    dto.setTargetEmail(r.getTarget().getEmail());

    dto.setType(r.getType());
    dto.setSeverity(r.getSeverity());

    if (r.getSubject() != null) {
      dto.setSubjectUserId(r.getSubject().getId());
      dto.setSubjectEmail(r.getSubject().getEmail());
    } else {
      dto.setSubjectUserId(null);
      dto.setSubjectEmail(null);
    }

    return dto;
  }

  /* ======================== Helpers ======================== */

  private User userByEmail(String email) {
    return userRepo.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
  }

  private boolean isAuthor(User me, Report r) {
    return r.getAuthor() != null && r.getAuthor().getId().equals(me.getId());
  }

  private boolean isTarget(User me, Report r) {
    return r.getTarget() != null && r.getTarget().getId().equals(me.getId());
  }

  private void requireAdmin(User me) {
    if (!isAdmin(me)) throw new AccessDeniedException("Admin only");
  }

  private boolean isAdmin(User u) {
    return hasRole(u, "ADMIN");
  }

  private boolean hasRole(User u, String roleUpper) {
    String raw = u.getRole();
    if (raw == null || raw.isBlank()) return false;

    String wanted = roleUpper.toUpperCase();

    String normalized = raw
        .replace("[", "")
        .replace("]", "")
        .replace("\"", "")
        .trim()
        .toUpperCase();

    for (String p : normalized.split(",")) {
      String r = p.trim();
      if (r.equals(wanted)) return true;

      if (wanted.equals("MANAGER") && r.contains("MANAGER")) return true;
      if (wanted.equals("ADMIN") && r.contains("ADMIN")) return true;
      if (wanted.equals("EMPLOYEE") && r.contains("EMPLOYEE")) return true;
    }
    return false;
  }
}
