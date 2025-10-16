package com.example.time_manager.service;

import com.example.time_manager.dto.absence.AbsenceCreateRequest;
import com.example.time_manager.dto.absence.AbsenceDayResponse;
import com.example.time_manager.dto.absence.AbsenceResponse;
import com.example.time_manager.dto.absence.AbsenceStatusUpdateRequest;
import com.example.time_manager.dto.absence.AbsenceUpdateRequest;
import com.example.time_manager.model.User;
import com.example.time_manager.model.absence.Absence;
import com.example.time_manager.model.absence.AbsenceDay;
import com.example.time_manager.model.absence.AbsencePeriod;
import com.example.time_manager.model.absence.AbsenceStatus;
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
import java.util.Map;
import java.time.LocalDateTime;

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
    public AbsenceResponse createForEmail(String email, AbsenceCreateRequest req) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        validateDates(req.getStartDate(), req.getEndDate());

        var a = new Absence();
        a.setUserId(user.getId());
        a.setStartDate(req.getStartDate());
        a.setEndDate(req.getEndDate());
        a.setType(req.getType());
        a.setReason(req.getReason());
        a.setSupportingDocumentUrl(req.getSupportingDocumentUrl());
        a.setStatus(AbsenceStatus.PENDING);

        a = absenceRepo.save(a);

        generateDays(a, req.getPeriodByDate());
        var days = dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(a.getId());
        return toDto(a, days);
    }

    /* =================== READ =================== */
    @Transactional(readOnly = true)
    public List<AbsenceResponse> listMine(String email) {
        var me = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        var rows = absenceRepo.findByUserIdOrderByStartDateDesc(me.getId());
        return mapWithDays(rows);
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponse> listForUser(String userId) {
        var rows = absenceRepo.findByUserIdOrderByStartDateDesc(userId);
        return mapWithDays(rows);
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponse> listAll() {
        var rows = absenceRepo.findAllByOrderByStartDateDesc();
        return mapWithDays(rows);
    }

    @Transactional(readOnly = true)
    public AbsenceResponse getVisibleTo(String email, Long id) {
        var me = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
        var a = absenceRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Absence not found: " + id));

        boolean isAdmin = hasRole(me, "ADMIN");
        boolean isManager = hasRole(me, "MANAGER");
        boolean isOwner = a.getUserId().equals(me.getId());

        if (!(isAdmin || isManager || isOwner)) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }

        var days = dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(a.getId());
        return toDto(a, days);
    }

    /* =================== UPDATE =================== */
    public AbsenceResponse updateVisibleTo(String email, Long id, AbsenceUpdateRequest req) {
        var me = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
        var a = absenceRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Absence not found: " + id));

        boolean isAdmin = hasRole(me, "ADMIN");
        boolean isOwner = a.getUserId().equals(me.getId());
        if (!(isAdmin || (isOwner && a.getStatus() == AbsenceStatus.PENDING))) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }

        if (req.getStartDate() != null) {
            a.setStartDate(req.getStartDate());
        }
        if (req.getEndDate() != null) {
            a.setEndDate(req.getEndDate());
        }
        if (req.getType() != null) {
            a.setType(req.getType());
        }
        if (req.getReason() != null) {
            a.setReason(req.getReason());
        }
        if (req.getSupportingDocumentUrl() != null) {
            a.setSupportingDocumentUrl(req.getSupportingDocumentUrl());
        }

        validateDates(a.getStartDate(), a.getEndDate());
        a = absenceRepo.save(a);

        if (req.getPeriodByDate() != null) {
            dayRepo.deleteByAbsenceId(a.getId());
            generateDays(a, req.getPeriodByDate());
        }

        var days = dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(a.getId());
        return toDto(a, days);
    }

    /* =================== STATUS (APPROVE/REJECT) =================== */
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
        if (req.getStatus() == AbsenceStatus.PENDING) {
            throw new IllegalArgumentException("Status must be APPROVED or REJECTED");
        }

        a.setStatus(req.getStatus());
        a.setApprovedBy(approver.getId());
        a.setApprovedAt(LocalDateTime.now());
        a = absenceRepo.save(a);
        var days = dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(a.getId());
        return toDto(a, days);
    }

    /* =================== DELETE =================== */
    public void deleteVisibleTo(String email, Long id) {
        var me = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
        var a = absenceRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Absence not found: " + id));

        boolean isAdmin = hasRole(me, "ADMIN");
        boolean isOwner = a.getUserId().equals(me.getId());
        if (!(isAdmin || (isOwner && a.getStatus() == AbsenceStatus.PENDING))) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }

        dayRepo.deleteByAbsenceId(id);
        absenceRepo.deleteById(id);
    }

    /* =================== Helpers =================== */
    private void validateDates(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("startDate and endDate are required");
        }
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("startDate must be on/before endDate");
        }
    }

    private void generateDays(Absence a, Map<LocalDate, AbsencePeriod> periodByDate) {
        var days = new ArrayList<AbsenceDay>();
        for (LocalDate d = a.getStartDate(); !d.isAfter(a.getEndDate()); d = d.plusDays(1)) {
            var day = new AbsenceDay();
            day.setAbsence(a);
            day.setAbsenceDate(d);

            AbsencePeriod p = AbsencePeriod.FULL_DAY;
            if (periodByDate != null) {
                AbsencePeriod override = periodByDate.get(d);
                if (override != null) {
                    p = override;
                }
            }
            day.setPeriod(p);

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
        List<AbsenceResponse> out = new ArrayList<>();
        for (Absence a : rows) {
            var days = dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(a.getId());
            out.add(toDto(a, days));
        }
        return out;
    }

    private AbsenceResponse toDto(Absence a, List<AbsenceDay> days) {
        var dto = new AbsenceResponse();

        // Champs AbsenceResponse
        dto.setId(a.getId());
        dto.setUserId(a.getUserId());
        dto.setStartDate(a.getStartDate());           // LocalDate -> LocalDate
        dto.setEndDate(a.getEndDate());               // LocalDate -> LocalDate
        dto.setType(a.getType());
        dto.setReason(a.getReason());
        dto.setSupportingDocumentUrl(a.getSupportingDocumentUrl());
        dto.setStatus(a.getStatus());
        dto.setApprovedBy(a.getApprovedBy());
        dto.setApprovedAt(a.getApprovedAt());         
        dto.setCreatedAt(a.getCreatedAt() != null ? a.getCreatedAt().toLocalDateTime() : null);
        dto.setUpdatedAt(a.getUpdatedAt() != null ? a.getUpdatedAt().toLocalDateTime() : null);

        List<AbsenceDayResponse> dayDtos = new ArrayList<>();
        for (AbsenceDay d : days) {
            var rd = new AbsenceDayResponse();
            rd.setId(d.getId());
            rd.setAbsenceDate(d.getAbsenceDate());
            rd.setPeriod(d.getPeriod());
            rd.setStartTime(d.getStartTime());
            rd.setEndTime(d.getEndTime());
            dayDtos.add(rd);
        }
        dto.setDays(dayDtos);

        return dto;
    }

    private boolean hasRole(User u, String roleUpper) {
        String raw = u.getRole();
        if (raw == null || raw.isBlank()) {
            return false;
        }
        String normalized = raw.replaceAll("[\\[\\]\\s\\\"]", "").toUpperCase(); // EMPLOYEE,MANAGER,ADMIN
        for (String r : normalized.split(",")) {
            if (r.equals(roleUpper)) {
                return true;
            }
        }
        return false;
    }
}
