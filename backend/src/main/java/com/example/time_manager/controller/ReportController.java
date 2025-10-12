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

@RestController
@RequestMapping("/api/reports")
public class ReportController {

  private final ReportService reportService;

  public ReportController(ReportService reportService) { this.reportService = reportService; }

  // ======= READ
  @GetMapping
  @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
  public List<ReportResponse> list(Authentication auth) {
    boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    if (isAdmin) return reportService.listAll();
    return reportService.listForManagerEmail(auth.getName());
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
  public ReportResponse get(@PathVariable Long id, Authentication auth) {
    var r = reportService.get(id);
    boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    if (!isAdmin && (r.managerEmail == null || !r.managerEmail.equals(auth.getName()))) {
      throw new org.springframework.security.access.AccessDeniedException("Forbidden");
    }
    return r;
  }

  // ======= WRITE (admin/manager)
  @PostMapping
  @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
  public ResponseEntity<ReportResponse> create(@RequestBody @Valid ReportCreateRequest req) {
    var saved = reportService.create(req);
    return ResponseEntity.created(URI.create("/api/reports/" + saved.id)).body(saved);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
  public ReportResponse update(@PathVariable Long id, @RequestBody @Valid ReportUpdateRequest req) {
    return reportService.update(id, req);
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    reportService.delete(id);
    return ResponseEntity.noContent().build();
  }

  // Map common JPA errors → HTTP codes
  @ExceptionHandler(EntityNotFoundException.class)
  public ResponseEntity<Void> notFound(EntityNotFoundException ex) {
    return ResponseEntity.notFound().build();
  }
}
