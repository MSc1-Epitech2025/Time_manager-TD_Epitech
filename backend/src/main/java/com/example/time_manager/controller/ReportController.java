package com.example.time_manager.controller;

import com.example.time_manager.dto.report.ReportCreateRequest;
import com.example.time_manager.dto.report.ReportResponse;
import com.example.time_manager.dto.report.ReportUpdateRequest;
import com.example.time_manager.service.ReportService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * REST API for Reports.
 * Visibility rules are enforced in the service layer.
 *
 * Summary:
 * - Any authenticated user can create a report (employee->manager, manager->employee)
 * - ADMIN can list all reports
 * - Everyone can list:
 *     - "my authored" reports
 *     - "my received" reports
 * - A report is readable if (ADMIN or author or target)
 * - A report is updatable/deletable if (ADMIN or author)
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

  private final ReportService reportService;

  public ReportController(ReportService reportService) { this.reportService = reportService; }

  /* ======================== CREATE ======================== */

  /**
   * Create a report as the currently authenticated user (author).
   * Body: { targetUserId, title, body? }
   */
  @PostMapping
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<ReportResponse> create(@RequestBody @Valid ReportCreateRequest req, Authentication auth) {
    var saved = reportService.createForAuthorEmail(auth.getName(), req);
    return ResponseEntity.created(URI.create("/api/reports/" + saved.id)).body(saved);
  }

  /* ======================== READ ======================== */

  /** ADMIN: list all reports (descending by createdAt). */
  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public List<ReportResponse> listAllForAdmin() {
    return reportService.listAllForAdmin();
  }

  /** My authored reports (written by me). */
  @GetMapping("/me/authored")
  @PreAuthorize("isAuthenticated()")
  public List<ReportResponse> myAuthored(Authentication auth) {
    return reportService.listAuthoredByEmail(auth.getName());
  }

  /** Reports addressed to me (I am the target). */
  @GetMapping("/me/received")
  @PreAuthorize("isAuthenticated()")
  public List<ReportResponse> myReceived(Authentication auth) {
    return reportService.listReceivedByEmail(auth.getName());
  }

  /**
   * Get a report by ID if visible to me:
   * visible when I am ADMIN, author or target.
   */
  @GetMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ReportResponse get(@PathVariable Long id, Authentication auth) {
    return reportService.getVisibleTo(auth.getName(), id);
  }

  /* ======================== UPDATE / DELETE ======================== */

  /** Update allowed if ADMIN or author. */
  @PutMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ReportResponse update(@PathVariable Long id,
                               @RequestBody @Valid ReportUpdateRequest req,
                               Authentication auth) {
    return reportService.updateVisibleTo(auth.getName(), id, req);
  }

  /** Delete allowed if ADMIN or author. */
  @DeleteMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
    reportService.deleteVisibleTo(auth.getName(), id);
    return ResponseEntity.noContent().build();
  }

  /* ======================== Exception mapping ======================== */

  @ExceptionHandler(EntityNotFoundException.class)
  public ResponseEntity<Void> notFound(EntityNotFoundException ex) {
    return ResponseEntity.notFound().build();
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<String> badDirection(IllegalStateException ex) {
    return ResponseEntity.badRequest().body(ex.getMessage());
  }
}
