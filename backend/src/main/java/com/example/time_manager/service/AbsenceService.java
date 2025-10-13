package com.example.time_manager.service;

import com.example.time_manager.dto.absence.AbsenceCreateRequest;
import com.example.time_manager.dto.absence.AbsenceDayResponse;
import com.example.time_manager.dto.absence.AbsenceResponse;
import com.example.time_manager.dto.absence.AbsenceStatusUpdateRequest;
import com.example.time_manager.dto.absence.AbsenceUpdateRequest;
import com.example.time_manager.model.absence.Absence;
import com.example.time_manager.model.absence.AbsenceDay;
import com.example.time_manager.model.absence.AbsencePeriod;
import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.AbsenceDayRepository;
import com.example.time_manager.repository.AbsenceRepository;
import com.example.time_manager.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class AbsenceService {

  private final AbsenceRepository absenceRepo;
  private final AbsenceDayRepository dayRepo;
  private final UserRepository userRepo;

  public AbsenceService(AbsenceRepository absenceRepo,
                        AbsenceDayRepository dayRepo,
                        UserRepository userRepo) {
    this.absenceRepo = absenceRepo;
    this.dayRepo = dayRepo;
    this.userRepo = userRepo;
  }

  /* =================== CREATE =================== */

  /** Create an absence for the authenticated user (by JWT email). */
  public AbsenceResponse createForEmail(String email, AbsenceCreateRequest req) {
    var user = userRepo.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    validateDates(req.startDate, req.endDate);

    var a = new Absence();
    a.setUser(user);
    a.setStartDate(req.startDate);
    a.setEndDate(req.endDate);
    a.setType(req.type);
    a.setReason(req.reason);
    a.setSupportingDocumentUrl(req.supportingDocumentUrl);
    a.setStatus(AbsenceStatus.PENDING);

    a = absenceRepo.save(a);

    generateDays(a, req.periodByDate);
    var days = dayRepo.findByAbsence_IdOrderByAbsenceDateAsc(a.getId());
    return toDto(a, days);
  }

  /* =================== READ =================== */

  /** List my absences (current user via email). */
  @Transactional(readOnly = true)
  public List<AbsenceResponse> listMine(String email) {
    var me = userRepo.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    var rows = absenceRepo.findByUser_IdOrderByStartDateDesc(me.getId());
    return mapWithDays(rows);
  }

  /** List absences for a specific user (manager/admin). */
  @Transactional(readOnly = true)
  public List<AbsenceResponse> listForUser(String userId) {
    var rows = absenceRepo.findByUser_IdOrderByStartDateDesc(userId);
    return mapWithDays(rows);
  }

  /** List all absences (admin). */
  @Transactional(readOnly = true)
  public List<AbsenceResponse> listAll() {
    var rows = absenceRepo.findAllByOrderByStartDateDesc();
    return mapWithDays(rows);
  }

  /** Get one absence if visible to requester (admin OR manager OR owner). */
  @Transactional(readOnly = true)
  public AbsenceResponse getVisibleTo(String email, Long id) {
    var me = userRepo.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    var a = absenceRepo.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Absence not found: " + id));

    boolean isAdmin = hasRole(me, "ADMIN");
    boolean isManager = hasRole(me, "MANAGER");
    boolean isOwner = a.getUser().getId().equals(me.getId());

    if (isAdmin || isManager || isOwner) {
      var days = dayRepo.findByAbsence_IdOrderByAbsenceDateAsc(a.getId());
      return toDto(a, days);
    }
    throw new org.springframework.security.access.AccessDeniedException("Forbidden");
  }

  /* =================== UPDATE =================== */

  /** Update if (ADMIN) or (OWNER and status=PENDING). May regenerate days if periodByDate provided. */
  public AbsenceResponse updateVisibleTo(String email, Long id, AbsenceUpdateRequest req) {
    var me = userRepo.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    var a = absenceRepo.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Absence not found: " + id));

    boolean isAdmin = hasRole(me, "ADMIN");
    boolean isOwner = a.getUser().getId().equals(me.getId());
    if (!(isAdmin || (isOwner && a.getStatus() == AbsenceStatus.PENDING))) {
      throw new org.springframework.security.access.AccessDeniedException("Forbidden");
    }

    if (req.startDate != null) a.setStartDate(req.startDate);
    if (req.endDate != null)   a.setEndDate(req.endDate);
    if (req.type != null)      a.setType(req.type);
    if (req.reason != null)    a.setReason(req.reason);
    if (req.supportingDocumentUrl != null) a.setSupportingDocumentUrl(req.supportingDocumentUrl);

    validateDates(a.getStartDate(), a.getEndDate());
    a = absenceRepo.save(a);

    if (req.periodByDate != null) {
      dayRepo.deleteByAbsence_Id(a.getId());
      generateDays(a, req.periodByDate);
    }

    var days = dayRepo.findByAbsence_IdOrderByAbsenceDateAsc(a.getId());
    return toDto(a, days);
  }

  /* =================== STATUS (APPROVE/REJECT) =================== */

  /** Approve / Reject (manager/admin). Records approver + timestamp. */
  public AbsenceResponse setStatus(String approverEmail, Long id, AbsenceStatusUpdateRequest req) {
    var approver = userRepo.findByEmail(approverEmail)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + approverEmail));
    var a = absenceRepo.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Absence not found: " + id));

    boolean isAdmin = hasRole(approver, "ADMIN");
    boolean isManager = hasRole(approver, "MANAGER");
    if (!(isAdmin || isManager)) {
      throw new org.springframework.security.access.AccessDeniedException("Forbidden");
    }

    if (req.status == null || req.status == AbsenceStatus.PENDING) {
      throw new IllegalArgumentException("Status must be APPROVED or REJECTED");
    }

    a.setStatus(req.status);
    a.setApprovedBy(approver);
    a.setApprovedAt(java.time.Instant.now());

    a = absenceRepo.save(a);
    var days = dayRepo.findByAbsence_IdOrderByAbsenceDateAsc(a.getId());
    return toDto(a, days);
  }

  /* =================== DELETE =================== */

  /** Delete if (ADMIN) or (OWNER and status=PENDING). */
  public void deleteVisibleTo(String email, Long id) {
    var me = userRepo.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    var a = absenceRepo.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Absence not found: " + id));

    boolean isAdmin = hasRole(me, "ADMIN");
    boolean isOwner = a.getUser().getId().equals(me.getId());
    if (!(isAdmin || (isOwner && a.getStatus() == AbsenceStatus.PENDING))) {
      throw new org.springframework.security.access.AccessDeniedException("Forbidden");
    }

    dayRepo.deleteByAbsence_Id(id);
    absenceRepo.deleteById(id);
  }

  /* =================== Helpers =================== */

  private void validateDates(LocalDate start, LocalDate end) {
    if (start.isAfter(end)) {
      throw new IllegalArgumentException("startDate must be on/before endDate");
    }
  }

  /** Generate absence_days for [startDate..endDate], with optional per-day period overrides. */
  private void generateDays(Absence a, java.util.Map<String, AbsencePeriod> periodByDate) {
    var days = new ArrayList<AbsenceDay>();
    for (LocalDate d = a.getStartDate(); !d.isAfter(a.getEndDate()); d = d.plusDays(1)) {
      var day = new AbsenceDay();
      day.setAbsence(a);
      day.setAbsenceDate(d);

      AbsencePeriod p = AbsencePeriod.FULL_DAY;
      if (periodByDate != null) {
        var override = periodByDate.get(d.toString()); // key: "YYYY-MM-DD"
        if (override != null) p = override;
      }
      day.setPeriod(p);

      // Optional default times for AM/PM (can be removed/changed per business rules)
      if (p == AbsencePeriod.AM) {
        day.setStartTime(LocalTime.of(8, 0));
        day.setEndTime(LocalTime.of(12, 0));
      } else if (p == AbsencePeriod.PM) {
        day.setStartTime(LocalTime.of(13, 0));
        day.setEndTime(LocalTime.of(17, 0));
      }

      days.add(day);
    }
    dayRepo.saveAll(days);
  }

  private List<AbsenceResponse> mapWithDays(List<Absence> rows) {
    return rows.stream()
        .map(a -> toDto(a, dayRepo.findByAbsence_IdOrderByAbsenceDateAsc(a.getId())))
        .toList();
  }

  private AbsenceResponse toDto(Absence a, List<AbsenceDay> days) {
    var dto = new AbsenceResponse();
    dto.id = a.getId();
    dto.userId = a.getUser().getId();
    dto.startDate = a.getStartDate().toString();
    dto.endDate = a.getEndDate().toString();
    dto.type = a.getType();
    dto.reason = a.getReason();
    dto.supportingDocumentUrl = a.getSupportingDocumentUrl();
    dto.status = a.getStatus();
    dto.approvedBy = a.getApprovedBy() != null ? a.getApprovedBy().getId() : null;
    dto.approvedAt = a.getApprovedAt();
    dto.createdAt = a.getCreatedAt();
    dto.updatedAt = a.getUpdatedAt();

    dto.days = new ArrayList<>();
    for (var d : days) {
      var rd = new AbsenceDayResponse();
      rd.id = d.getId();
      rd.date = d.getAbsenceDate().toString();
      rd.period = d.getPeriod();
      rd.startTime = d.getStartTime() != null ? d.getStartTime().toString() : null;
      rd.endTime = d.getEndTime() != null ? d.getEndTime().toString() : null;
      dto.days.add(rd);
    }
    return dto;
  }

  /** Naive role check from JSON in User.role (e.g. ["employee","manager"]). */
  private boolean hasRole(User u, String roleUpper) {
    String raw = u.getRole();
    if (raw == null || raw.isBlank()) return false;
    String normalized = raw.replaceAll("[\\[\\]\\s\\\"]", "").toUpperCase(); // EMPLOYEE,MANAGER,ADMIN
    for (String r : normalized.split(",")) {
      if (r.equals(roleUpper)) return true;
    }
    return false;
  }
}
