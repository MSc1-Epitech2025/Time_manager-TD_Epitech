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

import com.example.time_manager.dto.work_schedule.WorkScheduleResponse;
import com.example.time_manager.model.ClockKind;
import com.example.time_manager.model.Report;
import com.example.time_manager.model.User;
import com.example.time_manager.model.WorkDay;
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
  private final ClockService clockService;

  public AutoReportService(
      UserRepository userRepo,
      TeamMemberRepository teamMemberRepo,
      ReportRepository reportRepo,
      WorkScheduleService workScheduleService,
      ClockService clockService
  ) {
    this.userRepo = userRepo;
    this.teamMemberRepo = teamMemberRepo;
    this.reportRepo = reportRepo;
    this.workScheduleService = workScheduleService;
    this.clockService = clockService;
  }

  public void onClockCreated(String userId, ClockKind kind, Instant at) {
    ZoneId zone = ZoneId.systemDefault(); 
    LocalDate day = at.atZone(zone).toLocalDate();
    Instant dayStart = day.atStartOfDay(zone).toInstant();
    Instant dayEnd = day.plusDays(1).atStartOfDay(zone).toInstant();
    var clocks = clockService.listForUser(userId, dayStart, dayEnd).stream()
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

  /* ========================= LATE ARRIVAL ========================= */

  private void handleFirstInLateRule(String userId, Instant at, LocalDate day, ZoneId zone, List<?> clocks) {
    // 1) trouver le premier IN de la journée
    var firstIn = clocks.stream()
        .map(o -> (com.example.time_manager.dto.clock.ClockResponse)o) // adapte si ton type diffère
        .filter(c -> c.kind == ClockKind.IN)
        .min(Comparator.comparing(c -> c.at))
        .orElse(null);

    if (firstIn == null) return;
    if (!firstIn.at.equals(at)) return; // pas le premier IN => ignore

    ScheduleWindow w = scheduleWindow(userId, day);
    if (w == null || w.expectedStart == null) return;

    LocalTime actual = at.atZone(zone).toLocalTime();
    if (!actual.isAfter(w.expectedStart.plusMinutes(LATE_GRACE_MIN))) return;

    User subject = userRepo.findById(userId)
        .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

    boolean subjectIsManager = hasRole(subject, "manager");

    if (subjectIsManager) {
      for (User admin : admins()) {
        createLateReport(admin, subject, day, w.expectedStart, actual, "WARN");
      }
    } else {
      for (User manager : managersOfUserTeams(userId)) {
        createLateReport(manager, subject, day, w.expectedStart, actual, "INFO");
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

    r.setTitle("Late Detected: " + subject.getEmail());
    r.setBody(
        "Utilisateur : " + subject.getEmail() + "\n" +
        "Date : " + day + "\n" +
        "Prévu : " + expectedStart + " (+" + LATE_GRACE_MIN + " min)\n" +
        "Réel : " + actual + "\n"
    );

    reportRepo.save(r);
  }

  /* ========================= OUT / END OF DAY ========================= */

  private void handleOutEndOfDayRules(String userId, Instant at, LocalDate day, ZoneId zone, List<?> clocks) {
    var list = clocks.stream().map(o -> (com.example.time_manager.dto.clock.ClockResponse)o)
        .sorted(Comparator.comparing(c -> c.at))
        .toList();

    if (list.isEmpty()) return;

    var last = list.get(list.size() - 1);
    if (!last.at.equals(at)) return;

    ScheduleWindow w = scheduleWindow(userId, day);
    if (w == null) return;

    LocalTime outTime = at.atZone(zone).toLocalTime();

    if (w.pmEnd != null) {
      LocalTime threshold = w.pmEnd.minusMinutes(10); 
      if (outTime.isBefore(threshold)) {
        return; 
      }
    }

    int worked = workedMinutes(list, zone);
    int expected = w.expectedMinutes();

    if (expected > 0 && worked > expected + OVERWORK_GRACE_MIN) {
      User subject = userRepo.findById(userId)
          .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

      boolean subjectIsManager = hasRole(subject, "manager");
      int extra = worked - expected;

      if (subjectIsManager) {
        for (User admin : admins()) {
          createOverworkReport(admin, subject, day, worked, expected, extra);
        }
      } else {
        for (User manager : managersOfUserTeams(userId)) {
          createOverworkReport(manager, subject, day, worked, expected, extra);
        }
      }
    }
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

  /* ========================= CALCUL WORKED MINUTES ========================= */

  private int workedMinutes(List<com.example.time_manager.dto.clock.ClockResponse> clocks, ZoneId zone) {
    Instant currentIn = null;
    long totalSeconds = 0;

    for (var c : clocks) {
      if (c.kind == ClockKind.IN) {
        if (currentIn == null) currentIn = c.at;
      } else {
        if (currentIn != null) {
          if (c.at.isAfter(currentIn)) {
            totalSeconds += Duration.between(currentIn, c.at).getSeconds();
          }
          currentIn = null;
        }
      }
    }
    return (int)(totalSeconds / 60);
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
        sum += (int)Duration.between(st, en).toMinutes();
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

  private boolean hasRole(User u, String roleLower) {
    String raw = u.getRole();
    if (raw == null) return false;
    String normalized = raw.replace("[", "")
        .replace("]", "")
        .replace("\"", "")
        .toLowerCase();
    for (String part : normalized.split(",")) {
      if (part.trim().contains(roleLower)) return true;
    }
    return false;
  }
}
