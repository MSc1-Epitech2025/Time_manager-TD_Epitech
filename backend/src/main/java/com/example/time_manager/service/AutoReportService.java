package com.example.time_manager.service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.time_manager.dto.clock.ClockResponse;
import com.example.time_manager.dto.work_schedule.WorkScheduleResponse;
import com.example.time_manager.model.ClockKind;
import com.example.time_manager.model.Report;
import com.example.time_manager.model.User;
import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.absence.Absence;
import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.repository.ReportRepository;
import com.example.time_manager.repository.TeamMemberRepository;
import com.example.time_manager.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional
public class AutoReportService {

  private static final String SYSTEM_EMAIL = "system@time-manager.local";
  private static final int LATE_GRACE_MIN = 5;
  private static final int OVERWORK_GRACE_MIN = 30;

  private final UserRepository userRepo;
  private final TeamMemberRepository teamMemberRepo;
  private final ReportRepository reportRepo;
  private final WorkScheduleService workScheduleService;

  public AutoReportService(
      UserRepository userRepo,
      TeamMemberRepository teamMemberRepo,
      ReportRepository reportRepo,
      WorkScheduleService workScheduleService
  ) {
    this.userRepo = userRepo;
    this.teamMemberRepo = teamMemberRepo;
    this.reportRepo = reportRepo;
    this.workScheduleService = workScheduleService;
  }

  /* ==========================================================
   * ABSENCE: employee -> manager(s)
   * ========================================================== */

  public void onAbsenceRequested(Absence absence) {
    if (absence == null) return;

    User employee = requireUser(absence.getUserId());
    Set<User> managers = managersOfUserTeams(employee.getId());
    if (managers.isEmpty()) {
      managers = new java.util.HashSet<>(admins());
      if (managers.isEmpty()) return;
    }

    String title = "Absence Request : " + employee.getEmail();
    String body =
        "Employee : " + employee.getEmail() + "\n" +
        "Period : " + absence.getStartDate() + " -> " + absence.getEndDate() + "\n" +
        "Type : " + absence.getType() + "\n" +
        (absence.getReason() != null ? ("Reason : " + absence.getReason() + "\n") : "");

    for (User manager : managers) {
      String ruleKey = "ABSENCE_REQUEST:" + absence.getId() + ":" + manager.getId();
      if (reportRepo.existsByRuleKey(ruleKey)) continue;

      Report r = new Report();
      r.setAuthor(employee); 
      r.setTarget(manager);
      r.setSubject(employee);

      r.setType("ABSENCE_REQUEST");
      r.setSeverity("INFO");
      r.setRuleKey(ruleKey);

      r.setTitle(title);
      r.setBody(body);

      reportRepo.save(r);
    }
  }

  /* ==========================================================
   * ABSENCE: manager/admin -> employee
   * ========================================================== */

  public void onAbsenceStatusChanged(String changerEmail, Absence absence, AbsenceStatus previous) {
    if (absence == null) return;
    if (previous != null && previous == absence.getStatus()) return;

    User changer = userByEmail(changerEmail);
    User employee = requireUser(absence.getUserId());

    String newStatus = String.valueOf(absence.getStatus());
    String severity = "REJECTED".equalsIgnoreCase(newStatus) ? "WARN" : "INFO";

    String title = "Absence " + newStatus + " : " + employee.getEmail();
    String body =
        "Employé : " + employee.getEmail() + "\n" +
        "Par : " + changer.getEmail() + "\n" +
        "Période : " + absence.getStartDate() + " -> " + absence.getEndDate() + "\n" +
        "Type : " + absence.getType() + "\n" +
        "Ancien statut : " + previous + "\n" +
        "Nouveau statut : " + absence.getStatus() + "\n";

    String ruleKey = "ABSENCE_STATUS:" + absence.getId() + ":" + newStatus + ":" + employee.getId();
    if (reportRepo.existsByRuleKey(ruleKey)) return;

    Report r = new Report();
    r.setAuthor(changer);      // manager/admin -> employee
    r.setTarget(employee);
    r.setSubject(employee);

    r.setType("ABSENCE_STATUS");
    r.setSeverity(severity);
    r.setRuleKey(ruleKey);

    r.setTitle(title);
    r.setBody(body);

    reportRepo.save(r);
  }

  /* ==========================================================
   * CLOCK: late + overwork (pause-safe)
   * ========================================================== */

  /**
   * @param dayClocks
   */
  public void onClockCreated(String userId, ClockKind kind, Instant at, List<ClockResponse> dayClocks) {
    if (userId == null || at == null || dayClocks == null || dayClocks.isEmpty()) return;

    ZoneId zone = ZoneId.systemDefault();
    LocalDate day = at.atZone(zone).toLocalDate();

    var clocks = dayClocks.stream()
        .sorted(Comparator.comparing(c -> c.at))
        .toList();

    if (kind == ClockKind.IN) {
      handleFirstInLateRule(userId, at, day, zone, clocks);
      return;
    }

    if (kind == ClockKind.OUT) {
      handleOutEndOfDayRules(userId, at, day, zone, clocks);
    }
  }

  private void handleFirstInLateRule(String userId, Instant at, LocalDate day, ZoneId zone, List<ClockResponse> clocks) {
    var firstIn = clocks.stream()
        .filter(c -> c.kind == ClockKind.IN)
        .min(Comparator.comparing(c -> c.at))
        .orElse(null);

    if (firstIn == null) return;
    if (!firstIn.at.equals(at)) return;

    ScheduleWindow w = scheduleWindow(userId, day);
    if (w == null || w.expectedStart == null) return;

    LocalTime actual = at.atZone(zone).toLocalTime();
    if (!actual.isAfter(w.expectedStart.plusMinutes(LATE_GRACE_MIN))) return;

    User subject = requireUser(userId);
    boolean subjectIsManager = hasRole(subject, "manager");

    if (subjectIsManager) {
      for (User admin : admins()) createLateReport(admin, subject, day, w.expectedStart, actual, "WARN");
    } else {
      for (User manager : managersOfUserTeams(userId)) createLateReport(manager, subject, day, w.expectedStart, actual, "INFO");
    }
  }

  private void handleOutEndOfDayRules(String userId, Instant at, LocalDate day, ZoneId zone, List<ClockResponse> clocks) {
    if (clocks.isEmpty()) return;

    var last = clocks.get(clocks.size() - 1);
    if (!last.at.equals(at)) return;

    ScheduleWindow w = scheduleWindow(userId, day);
    if (w == null) return;

    LocalTime outTime = at.atZone(zone).toLocalTime();

   
    if (w.pmEnd != null) {
      LocalTime threshold = w.pmEnd.minusMinutes(10);
      if (outTime.isBefore(threshold)) return;
    }

    int worked = workedMinutes(clocks);
    int expected = w.expectedMinutes();

    if (expected > 0 && worked > expected + OVERWORK_GRACE_MIN) {
      User subject = requireUser(userId);
      boolean subjectIsManager = hasRole(subject, "manager");
      int extra = worked - expected;

      if (subjectIsManager) {
        for (User admin : admins()) createOverworkReport(admin, subject, day, worked, expected, extra);
      } else {
        for (User manager : managersOfUserTeams(userId)) createOverworkReport(manager, subject, day, worked, expected, extra);
      }
    }
  }

  private void createLateReport(User recipient, User subject, LocalDate day,
                                LocalTime expectedStart, LocalTime actual, String severity) {
    String type = "LATE_ARRIVAL";
    String ruleKey = type + ":" + day + ":" + subject.getId() + "->" + recipient.getId();
    if (reportRepo.existsByRuleKey(ruleKey)) return;

    Report r = new Report();
    r.setAuthor(systemUser());
    r.setTarget(recipient);
    r.setSubject(subject);

    r.setType(type);
    r.setSeverity(severity);
    r.setRuleKey(ruleKey);

    r.setTitle("Retard détecté : " + subject.getEmail());
    r.setBody(
        "Utilisateur : " + subject.getEmail() + "\n" +
        "Date : " + day + "\n" +
        "Prévu : " + expectedStart + " (+" + LATE_GRACE_MIN + " min)\n" +
        "Réel : " + actual + "\n"
    );

    reportRepo.save(r);
  }

  private void createOverworkReport(User recipient, User subject, LocalDate day,
                                    int workedMin, int expectedMin, int extraMin) {
    String type = "OVERWORK";
    String ruleKey = type + ":" + day + ":" + subject.getId() + "->" + recipient.getId();
    if (reportRepo.existsByRuleKey(ruleKey)) return;

    Report r = new Report();
    r.setAuthor(systemUser());
    r.setTarget(recipient);
    r.setSubject(subject);

    r.setType(type);
    r.setSeverity("WARN");
    r.setRuleKey(ruleKey);

    r.setTitle("Temps de travail élevé : " + subject.getEmail());
    r.setBody(
        "Utilisateur : " + subject.getEmail() + "\n" +
        "Date : " + day + "\n" +
        "Attendu : " + fmtMinutes(expectedMin) + "\n" +
        "Travaillé : " + fmtMinutes(workedMin) + "\n" +
        "Dépassement : " + fmtMinutes(extraMin) + " (seuil +" + OVERWORK_GRACE_MIN + " min)\n"
    );

    reportRepo.save(r);
  }

  private int workedMinutes(List<ClockResponse> clocks) {
    Instant currentIn = null;
    long totalSeconds = 0;

    for (var c : clocks) {
      if (c.kind == ClockKind.IN) {
        if (currentIn == null) currentIn = c.at;
      } else {
        if (currentIn != null && c.at.isAfter(currentIn)) {
          totalSeconds += Duration.between(currentIn, c.at).getSeconds();
          currentIn = null;
        }
      }
    }
    return (int) (totalSeconds / 60);
  }

  private String fmtMinutes(int minutes) {
    int h = minutes / 60;
    int m = minutes % 60;
    return String.format("%dh%02d", h, m);
  }

  /* ========================= SCHEDULE WINDOW ========================= */

  private static class ScheduleWindow {
    LocalTime expectedStart;
    LocalTime pmEnd;
    Integer expectedMinutes;
    int expectedMinutes() { return expectedMinutes == null ? 0 : expectedMinutes; }
  }

  private ScheduleWindow scheduleWindow(String userId, LocalDate day) {
    WorkDay wd = toWorkDay(day.getDayOfWeek());
    List<WorkScheduleResponse> slots = workScheduleService.listForUser(userId);

    List<WorkScheduleResponse> today = slots.stream()
        .filter(s -> s.dayOfWeek() == wd)
        .toList();

    if (today.isEmpty()) return null;

    ScheduleWindow w = new ScheduleWindow();

    w.expectedStart = today.stream()
        .map(WorkScheduleResponse::startTime)
        .filter(Objects::nonNull)
        .map(this::parseTime)
        .min(LocalTime::compareTo)
        .orElse(null);

    w.pmEnd = today.stream()
        .filter(s -> "PM".equalsIgnoreCase(String.valueOf(s.period())))
        .map(WorkScheduleResponse::endTime)
        .filter(Objects::nonNull)
        .map(this::parseTime)
        .max(LocalTime::compareTo)
        .orElse(null);

    int sum = 0;
    for (var s : today) {
      LocalTime st = parseTime(s.startTime());
      LocalTime en = parseTime(s.endTime());
      if (st != null && en != null && en.isAfter(st)) {
        sum += (int) Duration.between(st, en).toMinutes();
      }
    }
    w.expectedMinutes = sum;
    return w;
  }

  private LocalTime parseTime(String t) {
    if (t == null) return null;
    if (t.length() >= 8) return LocalTime.parse(t.substring(0, 8));
    return LocalTime.parse(t);
  }

  private WorkDay toWorkDay(DayOfWeek dow) {
    return switch (dow) {
      case MONDAY -> WorkDay.MON;
      case TUESDAY -> WorkDay.TUE;
      case WEDNESDAY -> WorkDay.WED;
      case THURSDAY -> WorkDay.THU;
      case FRIDAY -> WorkDay.FRI;
      case SATURDAY -> WorkDay.SAT;
      case SUNDAY -> WorkDay.SUN;
    };
  }

  /* ========================= RECIPIENTS / ROLES ========================= */

  private Set<User> managersOfUserTeams(String userId) {
    List<Long> teamIds = teamMemberRepo.findTeamIdsByUserId(userId);
    if (teamIds == null || teamIds.isEmpty()) return Set.of();

    Set<User> managers = new HashSet<>();
    for (Long teamId : teamIds) {
      List<User> users = teamMemberRepo.findUsersByTeamId(teamId);
      if (users == null) continue;
      for (User u : users) {
        if (hasRole(u, "manager")) managers.add(u);
      }
    }
    return managers;
  }

  private List<User> admins() {
    return userRepo.findAll().stream()
        .filter(u -> hasRole(u, "admin"))
        .collect(Collectors.toList());
  }

  private User systemUser() {
    return userRepo.findByEmail(SYSTEM_EMAIL)
        .orElseThrow(() -> new EntityNotFoundException("SYSTEM user missing: " + SYSTEM_EMAIL));
  }

  private User requireUser(String id) {
    return userRepo.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
  }

  private User userByEmail(String email) {
    return userRepo.findByEmail(email)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
  }

  private boolean hasRole(User u, String roleLower) {
    String raw = u.getRole();
    if (raw == null) return false;
    String normalized = raw.replace("[", "").replace("]", "").replace("\"", "").toLowerCase();
    for (String part : normalized.split(",")) {
      if (part.trim().contains(roleLower)) return true;
    }
    return false;
  }
}
