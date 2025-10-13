package com.example.time_manager.service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.time_manager.dto.work_schedule.WorkScheduleBatchRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleResponse;
import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;
import com.example.time_manager.model.WorkSchedule;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.repository.WorkScheduleRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional
public class WorkScheduleService {

  private final WorkScheduleRepository repo;
  private final UserRepository userRepo;

  public WorkScheduleService(WorkScheduleRepository repo, UserRepository userRepo) {
    this.repo = repo;
    this.userRepo = userRepo;
  }

  /* ============== READ ============== */

  @Transactional(readOnly = true)
  public List<WorkScheduleResponse> listForEmail(String email) {
    var user = userRepo.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    return listForUser(user.getId());
  }

  @Transactional(readOnly = true)
  public List<WorkScheduleResponse> listForUser(String userId) {
    return repo.findByUser_IdOrderByDayOfWeekAscPeriodAsc(userId)
               .stream().map(this::toDto).toList();
  }

  /* ============== UPSERT SINGLE ============== */

  public WorkScheduleResponse upsertForUser(String userId, WorkScheduleRequest req) {
    var user = userRepo.findById(userId).orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

    var start = parseTime(req.startTime);
    var end   = parseTime(req.endTime);
    validateTimeRange(start, end);

    var existing = repo.findByUser_IdAndDayOfWeekAndPeriod(userId, req.dayOfWeek, req.period);
    WorkSchedule ws = existing.orElseGet(WorkSchedule::new);

    ws.setUser(user);
    ws.setDayOfWeek(req.dayOfWeek);
    ws.setPeriod(req.period);
    ws.setStartTime(start);
    ws.setEndTime(end);

    ws = repo.save(ws);
    return toDto(ws);
  }

  /* ============== BATCH REPLACE ============== */

  /**
   * Replace the entire weekly schedule for a user with the provided entries (if replaceAll=true).
   * If replaceAll=false, behaves like multiple upserts.
   */
  public List<WorkScheduleResponse> batchForUser(String userId, WorkScheduleBatchRequest batch) {
    var user = userRepo.findById(userId).orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

    if (batch.replaceAll) {
      // delete all and insert new
      var existing = repo.findByUser_IdOrderByDayOfWeekAscPeriodAsc(userId);
      repo.deleteAll(existing);
    }

    List<WorkScheduleResponse> out = new ArrayList<>();
    for (var req : batch.entries) {
      var start = parseTime(req.startTime);
      var end   = parseTime(req.endTime);
      validateTimeRange(start, end);

      var existing = repo.findByUser_IdAndDayOfWeekAndPeriod(userId, req.dayOfWeek, req.period);
      WorkSchedule ws = existing.orElseGet(WorkSchedule::new);

      ws.setUser(user);
      ws.setDayOfWeek(req.dayOfWeek);
      ws.setPeriod(req.period);
      ws.setStartTime(start);
      ws.setEndTime(end);

      ws = repo.save(ws);
      out.add(toDto(ws));
    }
    return out;
  }

  /* ============== DELETE SINGLE ============== */

  public void deleteSlot(String userId, WorkDay day, WorkPeriod period) {
    repo.deleteByUser_IdAndDayOfWeekAndPeriod(userId, day, period);
  }

  /* ============== Helpers ============== */

  private WorkScheduleResponse toDto(WorkSchedule ws) {
    var dto = new WorkScheduleResponse();
    dto.id = ws.getId();
    dto.userId = ws.getUser().getId();
    dto.dayOfWeek = ws.getDayOfWeek();
    dto.period = ws.getPeriod();
    dto.startTime = ws.getStartTime().toString(); // HH:mm:ss
    dto.endTime = ws.getEndTime().toString();
    return dto;
  }

  private LocalTime parseTime(String value) {
    // Accept HH:mm or HH:mm:ss
    if (value.length() == 5) return LocalTime.parse(value + ":00");
    return LocalTime.parse(value);
  }

  private void validateTimeRange(LocalTime start, LocalTime end) {
    if (!start.isBefore(end)) {
      throw new IllegalArgumentException("startTime must be strictly before endTime");
    }
  }
}
