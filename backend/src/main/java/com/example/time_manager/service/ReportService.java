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

  /**
   * Create a report authored by the user identified by email (from JWT).
   * No role-based direction restriction: author -> target is always allowed.
   */
  public ReportResponse createForAuthorEmail(String authorEmail, ReportCreateRequest req) {
    User author = userByEmail(authorEmail);

    User target = userRepo.findById(req.getTargetUserId())
        .orElseThrow(() -> new EntityNotFoundException("Target user not found: " + req.getTargetUserId()));

    Report r = new Report();
    r.setAuthor(author);
    r.setTarget(target);
    r.setTitle(req.getTitle());
    r.setBody(req.getBody());

    r = reportRepo.save(r);
    return toDto(r);
  }

  /* ======================== READ ======================== */

  /** ADMIN: list all reports. */
  @Transactional(readOnly = true)
  public List<ReportResponse> listAllForAdmin(String email) {
    User me = userByEmail(email);
    requireAdmin(me);

    return reportRepo.findAllByOrderByCreatedAtDesc()
        .stream().map(this::toDto).toList();
  }

  /** "My authored reports" = reports created by me. */
  @Transactional(readOnly = true)
  public List<ReportResponse> listAuthoredByEmail(String email) {
    User me = userByEmail(email);
    return reportRepo.findByAuthor_IdOrderByCreatedAtDesc(me.getId())
        .stream().map(this::toDto).toList();
  }

  /** "Reports for me" = I am the target. */
  @Transactional(readOnly = true)
  public List<ReportResponse> listReceivedByEmail(String email) {
    User me = userByEmail(email);
    return reportRepo.findByTarget_IdOrderByCreatedAtDesc(me.getId())
        .stream().map(this::toDto).toList();
  }

  /**
   * Load a report if visible to the given email:
   * visible when user is ADMIN, author, or target.
   */
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

  /**
   * Update allowed for ADMIN or the author.
   * Note: if your ReportUpdateRequest does NOT contain targetUserId anymore,
   * then the reassignment block will simply never run.
   */
  public ReportResponse updateVisibleTo(String email, Long id, ReportUpdateRequest req) {
    Report r = reportRepo.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Report not found: " + id));

    User me = userByEmail(email);

    if (!(isAdmin(me) || isAuthor(me, r))) {
      throw new AccessDeniedException("Forbidden");
    }

    if (req.getTitle() != null) {
      r.setTitle(req.getTitle());
    }

    if (req.getBody() != null) {
      r.setBody(req.getBody());
    }

    r = reportRepo.save(r);
    return toDto(r);
  }
  /**
   * Delete allowed for ADMIN or the author.
   */
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

    // updatedAt: only if you add it to entity later
    // dto.setUpdatedAt(r.getUpdatedAt());

    dto.setAuthorId(r.getAuthor().getId());
    dto.setAuthorEmail(r.getAuthor().getEmail());

    dto.setTargetUserId(r.getTarget().getId());
    dto.setTargetEmail(r.getTarget().getEmail());

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

  /**
   * Role parsing robust for JSON-ish arrays stored as String:
   * Examples supported: ["ADMIN"], ["employee manager"], ["EMPLOYEE","MANAGER"], ADMIN
   */
  private boolean isAdmin(User u) {
    return hasRole(u, "ADMIN");
  }

  private boolean hasRole(User u, String roleUpper) {
    String raw = u.getRole();
    if (raw == null || raw.isBlank()) return false;

    String wanted = roleUpper.toUpperCase();

    // normalize: remove brackets/quotes, keep commas as separators
    String normalized = raw
        .replace("[", "")
        .replace("]", "")
        .replace("\"", "")
        .trim()
        .toUpperCase();

    // split by comma if JSON array, else single value
    String[] parts = normalized.split(",");

    for (String p : parts) {
      String r = p.trim();
      if (r.equals(wanted)) return true;

      // If you store "EMPLOYEE MANAGER" as a single string, treat it as containing MANAGER
      if (wanted.equals("MANAGER") && r.contains("MANAGER")) return true;
      if (wanted.equals("ADMIN") && r.contains("ADMIN")) return true;
      if (wanted.equals("EMPLOYEE") && r.contains("EMPLOYEE")) return true;
    }
    return false;
  }
}
