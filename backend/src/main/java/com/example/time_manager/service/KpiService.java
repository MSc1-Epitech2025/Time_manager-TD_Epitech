// src/main/java/com/example/time_manager/service/KpiService.java
package com.example.time_manager.service;

import com.example.time_manager.dto.absence.AbsenceResponse;
import com.example.time_manager.dto.kpi.*;
import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.service.leave.LeaveAccountService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class KpiService {

    private final AbsenceService absenceService;
    private final ClockService clockService;
    private final TeamService teamService;
    private final UserService userService;
    private final LeaveAccountService leaveAccountService;
    private final WorkScheduleService workScheduleService;

    // marge de tolérance (minutes) pour la ponctualité
    private static final int DEFAULT_GRACE_MINUTES = 10;

    public KpiService(AbsenceService absenceService,
                      ClockService clockService,
                      TeamService teamService,
                      UserService userService,
                      LeaveAccountService leaveAccountService,
                      WorkScheduleService workScheduleService) {
        this.absenceService = absenceService;
        this.clockService = clockService;
        this.teamService = teamService;
        this.userService = userService;
        this.leaveAccountService = leaveAccountService;
        this.workScheduleService = workScheduleService;
    }

    /* ===================== GLOBAL ===================== */

    public KpiGlobal kpiGlobal(LocalDate from, LocalDate to) {
        var users = userService.findAllUsers();
        int totalUsers = users.size();

        var teams = teamService.findAll();
        int totalTeams = teams.size();

        var absInRange = absenceService.listAll().stream()
                .filter(a -> overlapsAbsenceByDays(a, from, to))
                .toList();

        var approved = absInRange.stream().filter(this::isApproved).toList();

        long absenceRequests = absInRange.size();
        long approvedAbsences = approved.size();
        BigDecimal approvedDays = sumApprovedDays(approved);

        long totalWorked = 0L, totalOvertime = 0L, lateArrivals = 0L, earlyLeaves = 0L;

        for (var u : users) {
            var bundle = computeUserTimeKpis(u.getId(), from, to, DEFAULT_GRACE_MINUTES);
            totalWorked   += bundle.time().totalWorkedMinutes();
            totalOvertime += bundle.time().totalOvertimeMinutes();
            lateArrivals  += bundle.punctuality().lateArrivalsCount();
            earlyLeaves   += bundle.punctuality().earlyLeavesCount();
        }

        long avgWorked = totalUsers > 0 ? totalWorked / totalUsers : 0L;

        return new KpiGlobal(
                new DateRange(from, to),
                totalUsers,
                totalTeams,
                new AttendanceKpi(absenceRequests, approvedAbsences, approvedDays),
                new TimeKpi(totalWorked, avgWorked, totalOvertime),
                new PunctualityKpi(lateArrivals, earlyLeaves)
        );
    }

    /* ===================== BY USER ===================== */

    public KpiUser kpiByUser(String userId, LocalDate from, LocalDate to) {
        var absUser = absenceService.listForUser(userId).stream()
                .filter(a -> overlapsAbsenceByDays(a, from, to))
                .toList();

        var approved = absUser.stream().filter(this::isApproved).toList();

        long absenceRequests = absUser.size();
        long approvedAbsences = approved.size();
        BigDecimal approvedDays = sumApprovedDays(approved);

        var timeBundle = computeUserTimeKpis(userId, from, to, DEFAULT_GRACE_MINUTES);

        var balances = leaveAccountService.listByUser(userId).stream()
                .map(acc -> new LeaveBalanceItem(
                        acc.getLeaveType().getCode(),
                        leaveAccountService.computeCurrentBalance(acc.getId())
                ))
                .toList();

        return new KpiUser(
                userId,
                new DateRange(from, to),
                new AttendanceKpi(absenceRequests, approvedAbsences, approvedDays),
                timeBundle.time(),
                timeBundle.punctuality(),
                balances
        );
    }

    /* ===================== BY TEAM ===================== */

    public KpiTeam kpiByTeam(Long teamId, LocalDate from, LocalDate to) {
        var members = teamService.listMembers(teamId);
        int memberCount = members.size();

        String managerEmail = getCurrentEmail();
        var teamAbsences = absenceService.listTeamAbsences(managerEmail, teamId).stream()
                .filter(a -> overlapsAbsenceByDays(a, from, to))
                .toList();

        var approved = teamAbsences.stream().filter(this::isApproved).toList();

        long absenceRequests = teamAbsences.size();
        long approvedAbsences = approved.size();
        BigDecimal approvedDays = sumApprovedDays(approved);

        long totalWorked = 0L, totalOvertime = 0L, late = 0L, early = 0L;

        for (var u : members) {
            var bundle = computeUserTimeKpis(u.getId(), from, to, DEFAULT_GRACE_MINUTES);
            totalWorked   += bundle.time().totalWorkedMinutes();
            totalOvertime += bundle.time().totalOvertimeMinutes();
            late          += bundle.punctuality().lateArrivalsCount();
            early         += bundle.punctuality().earlyLeavesCount();
        }

        long avgWorked = memberCount > 0 ? totalWorked / memberCount : 0L;

        return new KpiTeam(
                teamId,
                new DateRange(from, to),
                memberCount,
                new AttendanceKpi(absenceRequests, approvedAbsences, approvedDays),
                new TimeKpi(totalWorked, avgWorked, totalOvertime),
                new PunctualityKpi(late, early)
        );
    }

    /* ===================== Helpers ===================== */

    private record TimeAndPunctuality(TimeKpi time, PunctualityKpi punctuality) {}

    private TimeAndPunctuality computeUserTimeKpis(String userId, LocalDate from, LocalDate to, int graceMinutes) {
        ZoneId zone = ZoneId.systemDefault();
        Instant fromInstant = from.atStartOfDay(zone).toInstant();
        Instant toInstantExclusive = to.plusDays(1).atStartOfDay(zone).toInstant();

        // Clocks
        @SuppressWarnings("unchecked")
        List<Object> clocks = (List<Object>) (List<?>) clockService.listForUser(userId, fromInstant, toInstantExclusive);

        List<Object> sortedClocks = clocks.stream()
                .sorted(Comparator.comparing(this::clockAtInstant))
                .toList();

        Map<LocalDate, Long> workedByDay = computeWorkedMinutesPerDay(sortedClocks, zone);
        long totalWorked = workedByDay.values().stream().mapToLong(Long::longValue).sum();

        // Schedules
        @SuppressWarnings("unchecked")
        List<Object> schedules = (List<Object>) (List<?>) workScheduleService.listForUser(userId);

        Map<DayOfWeek, List<Object>> scheduleByDow =
                schedules.stream().collect(Collectors.groupingBy(this::scheduleDayOfWeek));

        long overtimeTotal = 0L, lateArrivals = 0L, earlyLeaves = 0L;

        for (var d = from; !d.isAfter(to); d = d.plusDays(1)) {
            List<Object> daySched = scheduleByDow.getOrDefault(d.getDayOfWeek(), Collections.emptyList());
            if (daySched.isEmpty()) continue;

            long plannedMinutes = daySched.stream()
                    .mapToLong(s -> Duration.between(scheduleStartTime(s), scheduleEndTime(s)).toMinutes())
                    .sum();

            long worked = workedByDay.getOrDefault(d, 0L);
            overtimeTotal += Math.max(0L, worked - plannedMinutes);

            Instant firstIn = firstIn(sortedClocks, d, zone);
            Instant lastOut = lastOut(sortedClocks, d, zone);

            Optional<LocalTime> maybeFirstStart = daySched.stream()
                    .map(this::scheduleStartTime)
                    .min(LocalTime::compareTo);
            Optional<LocalTime> maybeLastEnd = daySched.stream()
                    .map(this::scheduleEndTime)
                    .max(LocalTime::compareTo);

            if (maybeFirstStart.isPresent() && firstIn != null) {
                var plannedStart = ZonedDateTime.of(d, maybeFirstStart.get(), zone).toInstant();
                if (firstIn.isAfter(plannedStart.plus(Duration.ofMinutes(graceMinutes)))) {
                    lateArrivals++;
                }
            }
            if (maybeLastEnd.isPresent() && lastOut != null) {
                var plannedEnd = ZonedDateTime.of(d, maybeLastEnd.get(), zone).toInstant();
                if (lastOut.isBefore(plannedEnd.minus(Duration.ofMinutes(graceMinutes)))) {
                    earlyLeaves++;
                }
            }
        }

        return new TimeAndPunctuality(
                new TimeKpi(totalWorked, 0L, overtimeTotal),
                new PunctualityKpi(lateArrivals, earlyLeaves)
        );
    }

    /* ---- Absences ---- */

    private static boolean overlapsAbsenceByDays(AbsenceResponse a, LocalDate from, LocalDate to) {
        List<?> days = getDays(a);
        if (days == null || days.isEmpty()) return false;
        LocalDate min = null, max = null;
        for (Object d : days) {
            LocalDate date = extractAbsenceDate(d);
            if (date == null) continue;
            if (min == null || date.isBefore(min)) min = date;
            if (max == null || date.isAfter(max))  max = date;
        }
        if (min == null || max == null) return false;
        return !min.isAfter(to) && !max.isBefore(from);
    }

    private static List<?> getDays(AbsenceResponse a) {
        try { return (List<?>) a.getClass().getMethod("days").invoke(a); } catch (Exception ignore) {}
        try { return (List<?>) a.getClass().getMethod("getDays").invoke(a); } catch (Exception ignore) {}
        return List.of();
    }

    private static LocalDate extractAbsenceDate(Object absenceDay) {
        Object v = invokeAny(absenceDay, List.of("getAbsenceDate", "absenceDate", "getDate", "date", "getDay", "day"));
        if (v instanceof LocalDate ld) return ld;
        if (v instanceof CharSequence cs) {
            try { return LocalDate.parse(cs.toString()); } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private static BigDecimal sumApprovedDays(List<AbsenceResponse> absences) {
        BigDecimal total = BigDecimal.ZERO;
        for (var a : absences) {
            for (Object d : getDays(a)) {
                Object p = invokeAny(d, List.of("getPeriod", "period"));
                String period = (p == null) ? "FULL_DAY" : p.toString().toUpperCase();
                switch (period) {
                    case "AM", "PM" -> total = total.add(BigDecimal.valueOf(0.5));
                    default         -> total = total.add(BigDecimal.ONE);
                }
            }
        }
        return total;
    }

    private boolean isApproved(AbsenceResponse a) {
        Object v = invokeAny(a, List.of("getStatus", "status", "getState", "state", "getApprovalStatus", "approvalStatus"));
        if (v == null) return true; // fallback pragmatique
        if (v instanceof AbsenceStatus s) return s == AbsenceStatus.APPROVED;
        String s = v.toString().trim().toUpperCase();
        return s.equals("APPROVED") || s.equals("APPROUVÉ") || s.equals("APPROUVE")
                || s.equals("VALIDATED") || s.equals("VALIDEE") || s.equals("VALIDÉE");
    }

    /* ---- Pointage ---- */

    private static Map<LocalDate, Long> computeWorkedMinutesPerDay(List<Object> clocks, ZoneId zone) {
        Map<LocalDate, Long> result = new HashMap<>();
        Instant pendingIn = null;

        for (Object c : clocks) {
            String kind = clockKind(c);
            if ("IN".equals(kind)) {
                if (pendingIn == null) pendingIn = clockAt(c);
            } else if ("OUT".equals(kind)) {
                if (pendingIn != null) {
                    Instant out = clockAt(c);
                    long minutes = Math.max(0L, Duration.between(pendingIn, out).toMinutes());
                    LocalDate day = LocalDateTime.ofInstant(pendingIn, zone).toLocalDate();
                    result.merge(day, minutes, Long::sum);
                    pendingIn = null;
                }
            }
        }
        return result;
    }

    private Instant firstIn(List<Object> clocks, LocalDate day, ZoneId zone) {
        Instant best = null;
        for (Object c : clocks) {
            if (!"IN".equals(clockKind(c))) continue;
            Instant t = clockAt(c);
            if (!LocalDateTime.ofInstant(t, zone).toLocalDate().equals(day)) continue;
            if (best == null || t.isBefore(best)) best = t;
        }
        return best;
    }

    private Instant lastOut(List<Object> clocks, LocalDate day, ZoneId zone) {
        Instant best = null;
        for (Object c : clocks) {
            if (!"OUT".equals(clockKind(c))) continue;
            Instant t = clockAt(c);
            if (!LocalDateTime.ofInstant(t, zone).toLocalDate().equals(day)) continue;
            if (best == null || t.isAfter(best)) best = t;
        }
        return best;
    }

    private Instant clockAtInstant(Object c) { return clockAt(c); }

    private static Instant clockAt(Object c) {
        Object v = invokeAny(c, List.of("at", "getAt", "timestamp", "getTimestamp", "time", "getTime"));
        if (v instanceof Instant i) return i;
        if (v instanceof ZonedDateTime zdt) return zdt.toInstant();
        if (v instanceof LocalDateTime ldt) return ldt.atZone(ZoneId.systemDefault()).toInstant();
        if (v instanceof OffsetDateTime odt) return odt.toInstant();
        if (v instanceof Number n) return Instant.ofEpochMilli(n.longValue());
        if (v instanceof CharSequence cs) {
            String s = cs.toString();
            try { return Instant.parse(s); } catch (Exception ignore) {}
            try { return OffsetDateTime.parse(s).toInstant(); } catch (Exception ignore) {}
            try { return LocalDateTime.parse(s).atZone(ZoneId.systemDefault()).toInstant(); } catch (Exception ignore) {}
        }
        throw new IllegalStateException("Clock entry has no parsable timestamp: " + c);
    }

    private static String clockKind(Object c) {
        Object v = invokeAny(c, List.of("kind", "getKind", "type", "getType"));
        if (v == null) return "";
        String s = v.toString().trim().toUpperCase();
        if (s.endsWith("IN"))  return "IN";
        if (s.endsWith("OUT")) return "OUT";
        return s;
    }

    /* ---- Planning ---- */

    private DayOfWeek scheduleDayOfWeek(Object s) {
        Object v = invokeAny(s, List.of("dayOfWeek", "getDayOfWeek", "dow", "getDow"));
        if (v instanceof DayOfWeek dow) return dow;
        if (v instanceof Number n) return DayOfWeek.of(n.intValue());
        if (v instanceof CharSequence cs) return DayOfWeek.valueOf(cs.toString().trim().toUpperCase());
        return DayOfWeek.MONDAY;
    }

    private LocalTime scheduleStartTime(Object s) {
        Object v = invokeAny(s, List.of("startTime", "getStartTime", "from", "getFrom"));
        return toLocalTime(v, LocalTime.of(9, 0));
    }

    private LocalTime scheduleEndTime(Object s) {
        Object v = invokeAny(s, List.of("endTime", "getEndTime", "to", "getTo"));
        return toLocalTime(v, LocalTime.of(17, 0));
    }

    private static LocalTime toLocalTime(Object v, LocalTime fallback) {
        if (v instanceof LocalTime lt) return lt;
        if (v instanceof CharSequence cs) {
            String s = cs.toString();
            try { return LocalTime.parse(s); } catch (DateTimeParseException ignore) {}
            try { return OffsetTime.parse(s).toLocalTime(); } catch (Exception ignore) {}
        }
        return fallback;
    }

    /* ---- Utils ---- */

    private static Object invokeAny(Object target, List<String> methodNames) {
        for (String name : methodNames) {
            try { return target.getClass().getMethod(name).invoke(target); }
            catch (Exception ignored) {}
        }
        return null;
    }

    private String getCurrentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null ? auth.getName() : null);
    }
}
