//package com.example.time_manager.service;
//
//import com.example.time_manager.model.kpi.*;
//import org.springframework.jdbc.core.JdbcTemplate;
//import org.springframework.stereotype.Service;
//
//import java.math.BigDecimal;
//import java.math.RoundingMode;
//import java.time.LocalDate;
//import java.util.*;
//
//@Service
//public class KpiServiceTest {
//
//    private final JdbcTemplate jdbc;
//
//    public KpiService(JdbcTemplate jdbc) {
//        this.jdbc = jdbc;
//    }
//
//    // Helper method to convert null to zero
//    private BigDecimal nz(Number value) {
//        if (value == null) {
//            return BigDecimal.ZERO;
//        }
//        return new BigDecimal(value.toString());
//    }
//
//    // Helper method to calculate ratio as percentage
//    private BigDecimal ratio(Number numerator, Number denominator) {
//        BigDecimal num = nz(numerator);
//        BigDecimal den = nz(denominator);
//
//        if (den.compareTo(BigDecimal.ZERO) == 0) {
//            return BigDecimal.ZERO;
//        }
//
//        return num.multiply(BigDecimal.valueOf(100))
//                .divide(den, 2, RoundingMode.HALF_UP);
//    }
//
//    // Generate CASE expression for weekday enum
//    private static String weekdayEnumExpr(String dateColumn) {
//        return String.format(
//                "CASE WEEKDAY(%s) " +
//                        "WHEN 0 THEN 'MON' " +
//                        "WHEN 1 THEN 'TUE' " +
//                        "WHEN 2 THEN 'WED' " +
//                        "WHEN 3 THEN 'THU' " +
//                        "WHEN 4 THEN 'FRI' " +
//                        "WHEN 5 THEN 'SAT' " +
//                        "WHEN 6 THEN 'SUN' " +
//                        "END",
//                dateColumn
//        );
//    }
//
//    public GlobalKpiSummary getGlobal(LocalDate startDate, LocalDate endDate) {
//        GlobalKpiSummary summary = new GlobalKpiSummary();
//
//        // Headcount
//        Integer headcount = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM users",
//                Integer.class
//        );
//        summary.setHeadcount(headcount != null ? headcount : 0);
//
//        // Managers and Admins
//        Integer managers = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM users WHERE JSON_CONTAINS(role, JSON_QUOTE('manager'))",
//                Integer.class
//        );
//        Integer admins = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM users WHERE JSON_CONTAINS(role, JSON_QUOTE('admin'))",
//                Integer.class
//        );
//
//        summary.setManagersShare(ratio(managers, headcount));
//        summary.setAdminsShare(ratio(admins, headcount));
//
//        // Presence days
//        Number presenceDays = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM clocks WHERE kind='IN' AND DATE(clock_time) BETWEEN ? AND ?",
//                Number.class,
//                startDate, endDate
//        );
//
//        // Expected work days
//        Number expectedDays = jdbc.queryForObject(
//                "WITH RECURSIVE dates AS (" +
//                        "  SELECT ? AS dt UNION ALL " +
//                        "  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM dates WHERE dt < ?" +
//                        ") " +
//                        "SELECT COUNT(*) FROM dates d " +
//                        "JOIN work_schedules ws ON WEEKDAY(d.dt) = ws.day_of_week " +
//                        "WHERE ws.is_working_day = TRUE",
//                Number.class,
//                startDate, endDate
//        );
//
//        summary.setPresenceRate(ratio(presenceDays, expectedDays));
//
//        // Total hours worked
//        Number totalMinutes = jdbc.queryForObject(
//                "SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, clock_time, " +
//                        "  LEAD(clock_time) OVER (PARTITION BY user_id ORDER BY clock_time))), 0) " +
//                        "FROM clocks WHERE kind='IN' AND DATE(clock_time) BETWEEN ? AND ?",
//                Number.class,
//                startDate, endDate
//        );
//
//        // Active days (days with at least one clock-in)
//        Number activeDays = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM (" +
//                        "  SELECT DISTINCT user_id, DATE(clock_time) " +
//                        "  FROM clocks WHERE kind='IN' AND DATE(clock_time) BETWEEN ? AND ? " +
//                        "  GROUP BY user_id, DATE(clock_time)" +
//                        ") AS active",
//                Number.class,
//                startDate, endDate
//        );
//
//        BigDecimal avgHours = BigDecimal.ZERO;
//        if (activeDays != null && activeDays.intValue() > 0) {
//            avgHours = nz(totalMinutes)
//                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP)
//                    .divide(nz(activeDays), 2, RoundingMode.HALF_UP);
//        }
//        summary.setAvgHoursPerDay(avgHours);
//
//        // Absence days
//        Number absenceDays = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM absence_days ad " +
//                        "JOIN absence a ON ad.absence_id = a.id " +
//                        "WHERE ad.absence_date BETWEEN ? AND ?",
//                Number.class,
//                startDate, endDate
//        );
//
//        summary.setAbsenceRate(ratio(absenceDays, expectedDays));
//
//        // Average absence duration
//        Number avgAbsenceDuration = jdbc.queryForObject(
//                "SELECT AVG(TIMESTAMPDIFF(DAY, start_date, end_date)) " +
//                        "FROM absence WHERE start_date BETWEEN ? AND ?",
//                Number.class,
//                startDate, endDate
//        );
//        summary.setAvgAbsenceDuration(nz(avgAbsenceDuration));
//
//        // Total reports
//        Integer totalReports = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM reports WHERE DATE(created_at) BETWEEN ? AND ?",
//                Integer.class,
//                startDate, endDate
//        );
//        summary.setTotalReports(totalReports != null ? totalReports : 0);
//
//        return summary;
//    }
//
//    public TeamKpiSummary getTeam(Integer teamId, LocalDate startDate, LocalDate endDate) {
//        TeamKpiSummary summary = new TeamKpiSummary();
//
//        // Team info
//        Map<String, Object> teamInfo = jdbc.queryForMap(
//                "SELECT id, name FROM teams WHERE id = ?",
//                teamId
//        );
//        summary.setTeamId((Integer) teamInfo.get("id"));
//        summary.setTeamName((String) teamInfo.get("name"));
//
//        // Member count
//        Integer memberCount = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM team_members WHERE team_id = ?",
//                Integer.class,
//                teamId
//        );
//        summary.setMemberCount(memberCount != null ? memberCount : 0);
//
//        // Presence days
//        Number presenceDays = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM clocks c " +
//                        "JOIN team_members tm ON c.user_id = tm.user_id " +
//                        "WHERE tm.team_id = ? AND c.kind='IN' AND DATE(c.clock_time) BETWEEN ? AND ?",
//                Number.class,
//                teamId, startDate, endDate
//        );
//
//        // Expected work days
//        Number expectedDays = jdbc.queryForObject(
//                "WITH RECURSIVE dates AS (" +
//                        "  SELECT ? AS dt UNION ALL " +
//                        "  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM dates WHERE dt < ?" +
//                        ") " +
//                        "SELECT COUNT(*) FROM dates d " +
//                        "JOIN work_schedules ws ON WEEKDAY(d.dt) = ws.day_of_week " +
//                        "JOIN team_members tm ON ws.user_id = tm.user_id " +
//                        "WHERE tm.team_id = ? AND ws.is_working_day = TRUE",
//                Number.class,
//                startDate, endDate, teamId
//        );
//
//        summary.setPresenceRate(ratio(presenceDays, expectedDays));
//
//        // Total hours worked
//        Number totalMinutes = jdbc.queryForObject(
//                "SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, c.clock_time, " +
//                        "  LEAD(c.clock_time) OVER (PARTITION BY c.user_id ORDER BY c.clock_time))), 0) " +
//                        "FROM clocks c " +
//                        "JOIN team_members tm ON c.user_id = tm.user_id " +
//                        "WHERE tm.team_id = ? AND c.kind='IN' AND DATE(c.clock_time) BETWEEN ? AND ?",
//                Number.class,
//                teamId, startDate, endDate
//        );
//
//        // Active days
//        Number activeDays = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM (" +
//                        "  SELECT DISTINCT c.user_id, DATE(c.clock_time) " +
//                        "  FROM clocks c " +
//                        "  JOIN team_members tm ON c.user_id = tm.user_id " +
//                        "  WHERE tm.team_id = ? AND c.kind='IN' AND DATE(c.clock_time) BETWEEN ? AND ? " +
//                        "  GROUP BY c.user_id, DATE(c.clock_time)" +
//                        ") AS active",
//                Number.class,
//                teamId, startDate, endDate
//        );
//
//        BigDecimal avgHours = BigDecimal.ZERO;
//        if (activeDays != null && activeDays.intValue() > 0) {
//            avgHours = nz(totalMinutes)
//                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP)
//                    .divide(nz(activeDays), 2, RoundingMode.HALF_UP);
//        }
//        summary.setAvgHoursPerDay(avgHours);
//
//        // Absence days
//        Number absenceDays = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM absence_days ad " +
//                        "JOIN absence a ON ad.absence_id = a.id " +
//                        "JOIN team_members tm ON a.user_id = tm.user_id " +
//                        "WHERE tm.team_id = ? AND ad.absence_date BETWEEN ? AND ?",
//                Number.class,
//                teamId, startDate, endDate
//        );
//
//        summary.setAbsenceRate(ratio(absenceDays, expectedDays));
//
//        // Total reports
//        Integer totalReports = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM reports r " +
//                        "JOIN team_members tm ON r.user_id = tm.user_id " +
//                        "WHERE tm.team_id = ? AND DATE(r.created_at) BETWEEN ? AND ?",
//                Integer.class,
//                teamId, startDate, endDate
//        );
//        summary.setTotalReports(totalReports != null ? totalReports : 0);
//
//        return summary;
//    }
//
//    public UserKpiSummary getUser(UUID userId, LocalDate startDate, LocalDate endDate) {
//        UserKpiSummary summary = new UserKpiSummary();
//
//        // User info
//        Map<String, Object> userInfo = jdbc.queryForMap(
//                "SELECT full_name FROM users WHERE id = ?",
//                userId
//        );
//        summary.setFullName((String) userInfo.get("full_name"));
//
//        // Presence days
//        Number presenceDays = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM clocks WHERE user_id = ? AND kind='IN' AND DATE(clock_time) BETWEEN ? AND ?",
//                Number.class,
//                userId, startDate, endDate
//        );
//
//        // Expected work days
//        Number expectedDays = jdbc.queryForObject(
//                "WITH RECURSIVE dates AS (" +
//                        "  SELECT ? AS dt UNION ALL " +
//                        "  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM dates WHERE dt < ?" +
//                        ") " +
//                        "SELECT COUNT(*) FROM dates d " +
//                        "JOIN work_schedules ws ON WEEKDAY(d.dt) = ws.day_of_week " +
//                        "WHERE ws.user_id = ? AND ws.is_working_day = TRUE",
//                Number.class,
//                startDate, endDate, userId
//        );
//
//        summary.setPresenceRate(ratio(presenceDays, expectedDays));
//
//        // Total hours worked
//        Number totalMinutes = jdbc.queryForObject(
//                "SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, clock_time, " +
//                        "  LEAD(clock_time) OVER (PARTITION BY user_id ORDER BY clock_time))), 0) " +
//                        "FROM clocks WHERE user_id = ? AND kind='IN' AND DATE(clock_time) BETWEEN ? AND ?",
//                Number.class,
//                userId, startDate, endDate
//        );
//
//        // Active days
//        Number activeDays = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM (" +
//                        "  SELECT DISTINCT DATE(clock_time) " +
//                        "  FROM clocks WHERE user_id = ? AND kind='IN' AND DATE(clock_time) BETWEEN ? AND ? " +
//                        "  GROUP BY DATE(clock_time)" +
//                        ") AS active",
//                Number.class,
//                userId, startDate, endDate
//        );
//
//        BigDecimal avgHours = BigDecimal.ZERO;
//        if (activeDays != null && activeDays.intValue() > 0) {
//            avgHours = nz(totalMinutes)
//                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP)
//                    .divide(nz(activeDays), 2, RoundingMode.HALF_UP);
//        }
//        summary.setAvgHoursPerDay(avgHours);
//
//        // Overtime calculation
//        Number plannedMinutes = jdbc.queryForObject(
//                "SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, plan_start, plan_end)), 0) " +
//                        "FROM work_schedules ws " +
//                        "WHERE ws.user_id = ? AND ws.is_working_day = TRUE",
//                Number.class,
//                userId, startDate, endDate
//        );
//
//        BigDecimal overtimeHours = nz(totalMinutes)
//                .subtract(nz(plannedMinutes))
//                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
//        summary.setOvertimeHours(overtimeHours);
//
//        // Punctuality
//        PunctualityKpi punctuality = new PunctualityKpi();
//
//        Number lateDays = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM (" +
//                        "  SELECT c.user_id, DATE(c.clock_time) AS dt " +
//                        "  FROM clocks c " +
//                        "  JOIN work_schedules ws ON c.user_id = ws.user_id AND WEEKDAY(c.clock_time) = ws.day_of_week " +
//                        "  WHERE c.user_id = ? AND c.kind='IN' AND DATE(c.clock_time) BETWEEN ? AND ? " +
//                        "  AND TIME(c.clock_time) > ws.plan_start " +
//                        "  GROUP BY c.user_id, DATE(c.clock_time)" +
//                        ") AS late",
//                Number.class,
//                userId, startDate, endDate, userId
//        );
//
//        punctuality.setLateRate(ratio(lateDays, activeDays));
//
//        Number avgDelayMinutes = jdbc.queryForObject(
//                "SELECT AVG(TIMESTAMPDIFF(MINUTE, ws.plan_start, TIME(c.clock_time))) " +
//                        "FROM clocks c " +
//                        "JOIN work_schedules ws ON c.user_id = ws.user_id AND WEEKDAY(c.clock_time) = ws.day_of_week " +
//                        "WHERE c.user_id = ? AND c.kind='IN' AND DATE(c.clock_time) BETWEEN ? AND ? " +
//                        "AND TIME(c.clock_time) > ws.plan_start",
//                Number.class,
//                userId, startDate, endDate, userId
//        );
//
//        punctuality.setAvgDelayMinutes(nz(avgDelayMinutes));
//        summary.setPunctuality(punctuality);
//
//        // Absence days
//        Number absenceDays = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM absence_days ad " +
//                        "JOIN absence a ON ad.absence_id = a.id " +
//                        "WHERE a.user_id = ? AND ad.absence_date BETWEEN ? AND ?",
//                Number.class,
//                userId, startDate, endDate
//        );
//
//        summary.setAbsenceRate(ratio(absenceDays, expectedDays));
//
//        // Absence by type
//        List<AbsenceByType> absenceByType = jdbc.query(
//                "SELECT a.type, SUM(TIMESTAMPDIFF(DAY, a.start_date, a.end_date)) AS days " +
//                        "FROM absence a " +
//                        "WHERE a.user_id = ? AND a.start_date BETWEEN ? AND ? " +
//                        "GROUP BY a.type",
//                (rs, rowNum) -> {
//                    AbsenceByType abt = new AbsenceByType();
//                    abt.setType(rs.getString("type"));
//                    abt.setDays(rs.getBigDecimal("days"));
//                    return abt;
//                },
//                userId, startDate, endDate
//        );
//        summary.setAbsenceByType(absenceByType);
//
//        // Leave balances
//        List<LeaveBalance> leaveBalances = jdbc.query(
//                "SELECT la.leave_type, la.opening_balance, la.accrued, la.debited, la.adjustments, la.expired " +
//                        "FROM leave_accounts la " +
//                        "WHERE la.user_id = ? AND la.year = YEAR(?) AND la.month = MONTH(?)",
//                (rs, rowNum) -> {
//                    LeaveBalance lb = new LeaveBalance();
//                    lb.setLeaveType(rs.getString("leave_type"));
//                    lb.setOpeningBalance(rs.getBigDecimal("opening_balance"));
//                    lb.setAccrued(rs.getBigDecimal("accrued"));
//                    lb.setDebited(rs.getBigDecimal("debited"));
//                    lb.setAdjustments(rs.getBigDecimal("adjustments"));
//                    lb.setExpired(rs.getBigDecimal("expired"));
//
//                    // Calculate current balance
//                    BigDecimal current = nz(lb.getOpeningBalance())
//                            .add(nz(lb.getAccrued()))
//                            .subtract(nz(lb.getDebited()))
//                            .add(nz(lb.getAdjustments()))
//                            .subtract(nz(lb.getExpired()));
//                    lb.setCurrentBalance(current);
//
//                    return lb;
//                },
//                userId, startDate, endDate
//        );
//        summary.setLeaveBalances(leaveBalances);
//
//        // Total reports
//        Integer totalReports = jdbc.queryForObject(
//                "SELECT COUNT(*) FROM reports WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ?",
//                Integer.class,
//                userId, startDate, endDate
//        );
//        summary.setTotalReports(totalReports != null ? totalReports : 0);
//
//        return summary;
//    }
//}