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

/**
 * Business logic for Reports:
 * - Allow both directions: employee -> manager, manager -> employee
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
   * Validates that the direction author -> target is allowed.
   */
  public ReportResponse createForAuthorEmail(String authorEmail, ReportCreateRequest req) {
    User author = userRepo.findByEmail(authorEmail)
        .orElseThrow(() -> new EntityNotFoundException("Author not found: " + authorEmail));

    User target = userRepo.findById(req.targetUserId)
        .orElseThrow(() -> new EntityNotFoundException("Target user not found: " + req.targetUserId));

    // Optional business rule: only employee->manager OR manager->employee (ADMIN can do anything)
    if (!isDirectionAllowed(author, target)) {
      throw new IllegalStateException("Report direction not allowed (employee->manager or manager->employee only).");
    }

    Report r = new Report();
    r.setAuthor(author);
    r.setTarget(target);
    r.setTitle(req.title);
    r.setBody(req.body);

    r = reportRepo.save(r);
    return toDto(r);
  }

  /* ======================== READ ======================== */

  /** ADMIN: list all reports. */
  @Transactional(readOnly = true)
  public List<ReportResponse> listAllForAdmin() {
    return reportRepo.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
  }

  /** "My authored reports" = reports created by me. */
  @Transactional(readOnly = true)
  public List<ReportResponse> listAuthoredByEmail(String email) {
    User me = userByEmail(email);
    return reportRepo.findByAuthor_IdOrderByCreatedAtDesc(me.getId()).stream().map(this::toDto).toList();
  }

  /** "Reports for me" = I am the target. */
  @Transactional(readOnly = true)
  public List<ReportResponse> listReceivedByEmail(String email) {
    User me = userByEmail(email);
    return reportRepo.findByTarget_IdOrderByCreatedAtDesc(me.getId()).stream().map(this::toDto).toList();
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

    boolean isAdmin = hasRole(me, "ADMIN");
    if (isAdmin) return toDto(r);

    boolean isAuthor = r.getAuthor().getId().equals(me.getId());
    boolean isTarget = r.getTarget().getId().equals(me.getId());
    if (isAuthor || isTarget) return toDto(r);

    throw new org.springframework.security.access.AccessDeniedException("Forbidden");
  }

  /* ======================== UPDATE / DELETE ======================== */

  /**
   * Update allowed for ADMIN or the author.
   * Can also reassign the target (if provided).
   */
  public ReportResponse updateVisibleTo(String email, Long id, ReportUpdateRequest req) {
    Report r = reportRepo.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Report not found: " + id));
    User me = userByEmail(email);

    boolean isAdmin = hasRole(me, "ADMIN");
    boolean isAuthor = r.getAuthor().getId().equals(me.getId());
    if (!(isAdmin || isAuthor)) {
      throw new org.springframework.security.access.AccessDeniedException("Forbidden");
    }

    if (req.title != null) r.setTitle(req.title);
    if (req.body != null)  r.setBody(req.body);

    if (req.targetUserId != null) {
      User target = userRepo.findById(req.targetUserId)
          .orElseThrow(() -> new EntityNotFoundException("Target user not found: " + req.targetUserId));
      r.setTarget(target);
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

    boolean isAdmin = hasRole(me, "ADMIN");
    boolean isAuthor = r.getAuthor().getId().equals(me.getId());
    if (!(isAdmin || isAuthor)) {
      throw new org.springframework.security.access.AccessDeniedException("Forbidden");
    }
    reportRepo.deleteById(id);
  }

  /* ======================== Helpers ======================== */

  private ReportResponse toDto(Report r) {
    var dto = new ReportResponse();
    dto.id = r.getId();
    dto.title = r.getTitle();
    dto.body = r.getBody();
    dto.createdAt = r.getCreatedAt();
    dto.authorId = r.getAuthor().getId();
    dto.authorEmail = r.getAuthor().getEmail();
    dto.targetUserId = r.getTarget().getId();
    dto.targetEmail = r.getTarget().getEmail();
    return dto;
  }

  private User userByEmail(String email) {
    return userRepo.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
  }

  /**
   * Naive role check from JSON string stored in User.role (e.g. ["employee","manager"]).
   */
  private boolean hasRole(User u, String roleUpper) {
    String raw = u.getRole();
    if (raw == null || raw.isBlank()) return false;
    String up = roleUpper.toUpperCase();
    String normalized = raw.replaceAll("[\\[\\]\\s\\\"]", "").toUpperCase(); // EMPLOYEE,MANAGER
    for (String r : normalized.split(",")) {
      if (r.equals(up)) return true;
    }
    return false;
  }

  /**
   * Business rule:
   *  - ADMIN can always send to any user
   *  - EMPLOYEE can send only to MANAGER
   *  - MANAGER can send only to EMPLOYEE
   */
  private boolean isDirectionAllowed(User author, User target) {
    if (hasRole(author, "ADMIN")) return true;

    boolean authorIsManager = hasRole(author, "MANAGER");
    boolean authorIsEmployee = hasRole(author, "EMPLOYEE");
    boolean targetIsManager = hasRole(target, "MANAGER");
    boolean targetIsEmployee = hasRole(target, "EMPLOYEE");

    if (authorIsEmployee && targetIsManager) return true;
    if (authorIsManager && targetIsEmployee) return true;

    return false;
  }
}
