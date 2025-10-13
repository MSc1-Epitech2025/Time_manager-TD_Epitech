package com.example.time_manager.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.time_manager.dto.work_schedule.WorkScheduleBatchRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleResponse;
import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;
import com.example.time_manager.service.WorkScheduleService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

/**
 * REST API for Work Schedules (weekly planning by AM/PM).
 * - Employees can read their own schedules (/me)
 * - Managers/Admins can manage schedules for any user
 */
@RestController
@RequestMapping("/api/work-schedules")
public class WorkScheduleController {

  private final WorkScheduleService service;

  public WorkScheduleController(WorkScheduleService service) {
    this.service = service;
  }

  /* ============== READ ============== */

  /** Get current user's schedule */
  @GetMapping("/me")
  public List<WorkScheduleResponse> mySchedule(Authentication auth) {
    return service.listForEmail(auth.getName());
  }

  /** Get a user's schedule (manager/admin) */
  @GetMapping("/users/{userId}")
  @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
  public List<WorkScheduleResponse> getForUser(@PathVariable String userId) {
    return service.listForUser(userId);
  }

  /* ============== UPSERT SINGLE ============== */

  /** Create or update a single slot (day+period) for a user (manager/admin). */
  @PostMapping("/users/{userId}")
  @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
  public WorkScheduleResponse upsertSlot(@PathVariable String userId,@RequestBody @Valid WorkScheduleRequest req) {
    return service.upsertForUser(userId, req);
  }

  /* ============== BATCH REPLACE ============== */

  /** Replace (or upsert) weekly schedule for a user from a list of entries (manager/admin). */
  @PutMapping("/users/{userId}/batch")
  @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
  public List<WorkScheduleResponse> batch(@PathVariable String userId,
                                          @RequestBody @Valid WorkScheduleBatchRequest req) {
    return service.batchForUser(userId, req);
  }

  /* ============== DELETE SINGLE ============== */

  /** Delete a single slot for a user (manager/admin). */
  @DeleteMapping("/users/{userId}")
  @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
  public ResponseEntity<Void> deleteSlot(@PathVariable String userId, @RequestParam("day") WorkDay day, @RequestParam("period") WorkPeriod period) {
    service.deleteSlot(userId, day, period);
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
