package com.example.time_manager.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.time_manager.dto.absence.AbsenceCreateRequest;
import com.example.time_manager.dto.absence.AbsenceResponse;
import com.example.time_manager.dto.absence.AbsenceStatusUpdateRequest;
import com.example.time_manager.dto.absence.AbsenceUpdateRequest;
import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.service.AbsenceService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/absences")
public class AbsenceController {

  private final AbsenceService service;

  public AbsenceController(AbsenceService service) {
    this.service = service;
  }

  /* ============== CREATE (any authenticated) ============== */

  @PostMapping
  @PreAuthorize("isAuthenticated()")
  public AbsenceResponse create(@RequestBody @Valid AbsenceCreateRequest req, Authentication auth) {
    return service.createForEmail(auth.getName(), req);
  }

  /* ============== READ ============== */

  /** My absences */
  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  public List<AbsenceResponse> mine(Authentication auth) {
    return service.listMine(auth.getName());
  }

  /** Absences of a user (manager/admin) */
  @GetMapping("/users/{userId}")
  @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
  public List<AbsenceResponse> forUser(@PathVariable String userId) {
    return service.listForUser(userId);
  }

  /** All absences (admin) */
  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public List<AbsenceResponse> all() {
    return service.listAll();
  }

  /** View one absence if visible (admin OR owner OR manager) */
  @GetMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public AbsenceResponse get(@PathVariable Long id, Authentication auth) {
    return service.getVisibleTo(auth.getName(), id);
  }

  /* ============== UPDATE ============== */

  /** Update if (ADMIN) or (OWNER and status=PENDING). */
  @PutMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public AbsenceResponse update(@PathVariable Long id,
                                @RequestBody @Valid AbsenceUpdateRequest req,
                                Authentication auth) {
    return service.updateVisibleTo(auth.getName(), id, req);
  }

  /* ============== STATUS (APPROVE/REJECT) ============== */

  /** Approve/Reject (MANAGER/ADMIN). */
  @PatchMapping("/{id}/status")
  @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
  public AbsenceResponse setStatus(@PathVariable Long id,
                                   @RequestBody @Valid AbsenceStatusUpdateRequest req,
                                   Authentication auth) {
    if (req.status == AbsenceStatus.PENDING) {
      throw new IllegalArgumentException("Status can only be set to APPROVED or REJECTED");
    }
    return service.setStatus(auth.getName(), id, req);
  }

  /* ============== DELETE ============== */

  /** Delete if (ADMIN) or (OWNER and status=PENDING). */
  @DeleteMapping("/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
    service.deleteVisibleTo(auth.getName(), id);
    return ResponseEntity.noContent().build();
  }

  /* ============== Error mapping ============== */

  @ExceptionHandler(EntityNotFoundException.class)
  public ResponseEntity<Void> notFound(EntityNotFoundException ex) {
    return ResponseEntity.notFound().build();
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<String> badRequest(IllegalArgumentException ex) {
    return ResponseEntity.badRequest().body(ex.getMessage());
  }
}
