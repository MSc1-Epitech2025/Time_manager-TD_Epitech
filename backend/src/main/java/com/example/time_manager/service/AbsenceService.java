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
import com.example.time_manager.repository.TeamMemberRepository;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.leave.LeaveAccountingBridge;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class AbsenceService {

    private final AbsenceRepository absenceRepo;
    private final AbsenceDayRepository dayRepo;
    private final UserRepository userRepo;
    private final TeamMemberRepository teamMemberRepo;
    private final LeaveAccountingBridge leaveAccountingBridge;

    public AbsenceService(AbsenceRepository absenceRepo,
            AbsenceDayRepository dayRepo,
            UserRepository userRepo,
            TeamMemberRepository teamMemberRepo,
            LeaveAccountingBridge leaveAccountingBridge) {
        this.absenceRepo = absenceRepo;
        this.dayRepo = dayRepo;
        this.userRepo = userRepo;
        this.teamMemberRepo = teamMemberRepo;
        this.leaveAccountingBridge = leaveAccountingBridge;
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
    public List<AbsenceResponse> listForUser(String targetUserId) {
        String requesterId = currentUserId();
        var requester = userRepo.findById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("Requester not found: " + requesterId));

        boolean isAdmin = isAdmin(requester);
        boolean isManager = isManager(requester);
        boolean isOwner = requesterId.equals(targetUserId);

        if (!(isAdmin || isOwner || (isManager && canManagerActOn(requester, targetUserId)))) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }

        var rows = absenceRepo.findByUserIdOrderByStartDateDesc(targetUserId);
        return mapWithDays(rows);
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponse> listAll() {
        String requesterId = currentUserId();
        var requester = userRepo.findById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("Requester not found: " + requesterId));

        if (!isAdmin(requester)) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden: admin only");
        }

        var rows = absenceRepo.findAllByOrderByStartDateDesc();
        return mapWithDays(rows);
    }

    @Transactional(readOnly = true)
    public AbsenceResponse getVisibleTo(String email, Long id) {
        var requester = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
        var a = absenceRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Absence not found: " + id));

        boolean isAdmin = hasRole(requester, "ADMIN");
        boolean isManager = hasRole(requester, "MANAGER");
        boolean isOwner = a.getUserId().equals(requester.getId());

        if (isAdmin || isOwner || (isManager && canManagerActOn(requester, a.getUserId()))) {
            var days = dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(a.getId());
            return toDto(a, days);
        }
        throw new org.springframework.security.access.AccessDeniedException("Forbidden");
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponse> listTeamAbsences(String managerEmail, Long teamId) {
        var manager = userRepo.findByEmail(managerEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + managerEmail));

        if (!hasRole(manager, "MANAGER")) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden: manager only");
        }

        List<String> teamUserIds = new ArrayList<>();

        if (teamId != null) {
            var managerTeams = teamMemberRepo.findTeamIdsByUserId(manager.getId());
            if (managerTeams.stream().noneMatch(id -> id.equals(teamId))) {
                throw new org.springframework.security.access.AccessDeniedException("Forbidden: not your team");
            }
            var users = teamMemberRepo.findUsersByTeamId(teamId);
            for (var u : users) {
                teamUserIds.add(u.getId());
            }
        } else {
            var managerTeams = teamMemberRepo.findTeamIdsByUserId(manager.getId());
            for (Long tid : managerTeams) {
                var users = teamMemberRepo.findUsersByTeamId(tid);
                for (var u : users) {
                    teamUserIds.add(u.getId());
                }
            }
        }

        if (teamUserIds.isEmpty()) {
            return List.of();
        }

        List<Absence> rows = absenceRepo.findByUserIdInOrderByStartDateDesc(teamUserIds);
        return mapWithDays(rows);
    }

    @Transactional(readOnly = true)
    public List<AbsenceResponse> listTeamAbsences(Long teamId) {
        if (teamId == null) {
            throw new IllegalArgumentException("teamId is required");
        }

        // user courant
        String requesterId = currentUserId();
        var requester = userRepo.findById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("Requester not found: " + requesterId));

        // sécurité : admin only
        if (!isAdmin(requester)) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden: admin only");
        }

        var users = teamMemberRepo.findUsersByTeamId(teamId);
        if (users == null || users.isEmpty()) {
            return List.of();
        }

        List<String> teamUserIds = new ArrayList<>();
        for (User u : users) {
            teamUserIds.add(u.getId());
        }

        List<Absence> rows = absenceRepo.findByUserIdInOrderByStartDateDesc(teamUserIds);
        return mapWithDays(rows);
    }

    /* =================== UPDATE =================== */
    public AbsenceResponse updateVisibleTo(String email, Long id, AbsenceUpdateRequest req) {
        var requester = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
        var a = absenceRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Absence not found: " + id));

        boolean isAdmin = hasRole(requester, "ADMIN");
        boolean isOwner = a.getUserId().equals(requester.getId());
        boolean isManager = hasRole(requester, "MANAGER");

        if (!(isAdmin || isOwner || (isManager && canManagerActOn(requester, a.getUserId())))) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }
        if (!isAdmin && !isManager && !(isOwner && a.getStatus() == AbsenceStatus.PENDING)) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden: owner can edit only while PENDING");
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

        if (a.getStatus() == AbsenceStatus.APPROVED) {
            leaveAccountingBridge.ensureDebitForApprovedAbsence(a);
        }

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

        if (!(isAdmin || (isManager && canManagerActOn(approver, a.getUserId())))) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }

        if (req.getStatus() == AbsenceStatus.PENDING) {
            throw new IllegalArgumentException("Status must be APPROVED or REJECTED");
        }

        a.setStatus(req.getStatus());
        a.setApprovedBy(approver.getId());
        a.setApprovedAt(LocalDateTime.now());
        a = absenceRepo.save(a);
        switch (a.getStatus()) {
            case APPROVED ->
                leaveAccountingBridge.ensureDebitForApprovedAbsence(a);
            case REJECTED ->
                leaveAccountingBridge.removeDebitForAbsence(a.getId());
            default -> {
                /* rien */ }
        }

        var days = dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(a.getId());
        return toDto(a, days);
    }

    /* =================== DELETE =================== */
    public void deleteVisibleTo(String email, Long id) {
        var requester = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
        var a = absenceRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Absence not found: " + id));

        boolean isAdmin = hasRole(requester, "ADMIN");
        boolean isOwner = a.getUserId().equals(requester.getId());
        boolean isManager = hasRole(requester, "MANAGER");

        if (!(isAdmin || isOwner || (isManager && canManagerActOn(requester, a.getUserId())))) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }
        if (!isAdmin && !isManager && !(isOwner && a.getStatus() == AbsenceStatus.PENDING)) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden: owner can delete only while PENDING");
        }
        leaveAccountingBridge.removeDebitForAbsence(id);
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
        dto.setId(a.getId());
        dto.setUserId(a.getUserId());
        dto.setStartDate(a.getStartDate());
        dto.setEndDate(a.getEndDate());
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

    private boolean hasRole(User u, String roleFragment) {
        if (u == null) {
            return false;
        }
        String raw = u.getRole();
        if (raw == null) {
            return false;
        }
        String lower = raw.toLowerCase();
        String target = roleFragment.toLowerCase();
        return lower.contains(target);
    }

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new SecurityException("Unauthenticated");
        }
        String subject = auth.getName();
        if (subject.contains("@")) {
            return userRepo.findByEmail(subject)
                    .map(User::getId)
                    .orElseThrow(() -> new IllegalStateException("No user for email subject: " + subject));
        }
        return subject;
    }

    private boolean canManagerActOn(User manager, String targetUserId) {
        if (manager.getId().equals(targetUserId)) {
            return true;
        }
        List<Long> managerTeams = teamMemberRepo.findTeamIdsByUserId(manager.getId());
        if (managerTeams.isEmpty()) {
            return false;
        }
        for (Long teamId : managerTeams) {
            if (teamMemberRepo.existsByTeam_IdAndUser_Id(teamId, targetUserId)) {
                return true;
            }
        }
        return false;
    }

    private boolean isAdmin(User u) {
        return hasRole(u, "admin");
    }

    private boolean isManager(User u) {
        return hasRole(u, "manager");
    }
}
