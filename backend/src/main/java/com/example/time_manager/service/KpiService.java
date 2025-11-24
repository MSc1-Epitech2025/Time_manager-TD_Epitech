package com.example.time_manager.service;

import com.example.time_manager.model.kpi.*;
import com.example.time_manager.model.kpi.AbsenceBreakdown;
import com.example.time_manager.model.kpi.LeaveBalance;
import com.example.time_manager.model.kpi.PunctualityStats;
import com.example.time_manager.model.kpi.TeamKpiSummary;
import com.example.time_manager.model.kpi.UserKpiSummary;
import com.example.time_manager.model.kpi.GlobalKpiSummary;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.*;

@Service
public class KpiService {

    private final JdbcTemplate jdbc;

    public KpiService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // -------------------- Helpers --------------------
    private static String weekdayEnumExpr(String aliasDateCol) {
        return "CASE WEEKDAY(" + aliasDateCol + ") "
             + "WHEN 0 THEN 'MON' WHEN 1 THEN 'TUE' WHEN 2 THEN 'WED' WHEN 3 THEN 'THU' "
             + "WHEN 4 THEN 'FRI' WHEN 5 THEN 'SAT' ELSE 'SUN' END";
    }

    private static BigDecimal nz(Number n) {
        return (n == null) ? BigDecimal.ZERO : new BigDecimal(n.toString());
    }

    private BigDecimal ratio(Number a, Number b) {
        BigDecimal A = nz(a), B = nz(b);
        if (B.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return A.multiply(BigDecimal.valueOf(100))
                .divide(B, 2, java.math.RoundingMode.HALF_UP);
    }

    // -------------------- Global --------------------
    @Transactional(readOnly = true)
    public GlobalKpiSummary getGlobal(LocalDate start, LocalDate end) {
        GlobalKpiSummary k = new GlobalKpiSummary();
        k.setPeriodStart(start);
        k.setPeriodEnd(end);

        Integer headcount = jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        k.setHeadcount(headcount);

        Integer managers = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE JSON_CONTAINS(role, JSON_QUOTE('manager'))",
                Integer.class);
        Integer admins = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE JSON_CONTAINS(role, JSON_QUOTE('admin'))",
                Integer.class);
        k.setManagersShare(ratio(managers, headcount));
        k.setAdminsShare(ratio(admins, headcount));

        Number presentDays = jdbc.queryForObject(
                "SELECT COUNT(DISTINCT CONCAT(user_id,'#', DATE(`at`))) FROM clocks " +
                "WHERE `at` BETWEEN ? AND ? AND kind='IN'",
                Number.class, start, end.plusDays(1));

        Number plannedDays = jdbc.queryForObject(
                "WITH RECURSIVE d AS (" +
                "  SELECT ? AS dt UNION ALL " +
                "  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM d WHERE dt < ?" +
                ") " +
                "SELECT COUNT(*) FROM (" +
                "  SELECT DISTINCT ws.user_id, d.dt " +
                "  FROM d " +
                "  JOIN work_schedules ws ON ws.day_of_week = " + weekdayEnumExpr("d.dt") +
                ") x",
                Number.class, start, end);
        k.setPresenceRate(ratio(presentDays, plannedDays));

        Number totalMinutes = jdbc.queryForObject(
                "SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, first_in, last_out)),0) FROM (" +
                "  SELECT user_id, DATE(`at`) d, " +
                "         MIN(CASE WHEN kind='IN' THEN `at` END) AS first_in, " +
                "         MAX(CASE WHEN kind='OUT' THEN `at` END) AS last_out " +
                "  FROM clocks " +
                "  WHERE `at` BETWEEN ? AND ? " +
                "  GROUP BY user_id, DATE(`at`) " +
                "  HAVING first_in IS NOT NULL AND last_out IS NOT NULL" +
                ") t",
                Number.class, start, end.plusDays(1));

        Number dayCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM (" +
                "  SELECT user_id, DATE(`at`) d " +
                "  FROM clocks WHERE `at` BETWEEN ? AND ? " +
                "  GROUP BY user_id, DATE(`at`)" +
                ") s",
                Number.class, start, end.plusDays(1));

        BigDecimal avgHours = (nz(totalMinutes)
                .divide(new BigDecimal(dayCount == null ? 1 : dayCount.longValue()), 2, java.math.RoundingMode.HALF_UP))
                .divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
        k.setAvgHoursPerDay(avgHours);

        Number absenceDays = jdbc.queryForObject(
                "SELECT COALESCE(SUM(CASE period " +
                " WHEN 'FULL_DAY' THEN 1 WHEN 'AM' THEN 0.5 WHEN 'PM' THEN 0.5 END),0) " +
                "FROM absence_days ad " +
                "JOIN absence a ON a.id = ad.absence_id " +
                "WHERE absence_date BETWEEN ? AND ?",
                Number.class, start, end);
        k.setTotalAbsenceDays(nz(absenceDays));
        k.setAbsenceRate(ratio(absenceDays, plannedDays));

        Number approvalDelay = jdbc.queryForObject(
                "SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, approved_at)) " +
                "FROM absence " +
                "WHERE approved_at IS NOT NULL AND created_at BETWEEN ? AND ?",
                Number.class, start.atStartOfDay(), end.plusDays(1).atStartOfDay());
        k.setApprovalDelayHours(nz(approvalDelay));

        Integer totalReports = jdbc.queryForObject(
                "SELECT COUNT(*) FROM reports WHERE created_at BETWEEN ? AND ?",
                Integer.class, start.atStartOfDay(), end.plusDays(1).atStartOfDay());
        k.setTotalReports(totalReports);

        return k;
    }

    // -------------------- Team --------------------
    @Transactional(readOnly = true)
    public TeamKpiSummary getTeam(Integer teamId, LocalDate start, LocalDate end) {
        TeamKpiSummary k = new TeamKpiSummary();
        k.setTeamId(teamId);
        k.setPeriodStart(start);
        k.setPeriodEnd(end);

        Map<String, Object> team = jdbc.queryForMap("SELECT id, name FROM teams WHERE id=?", teamId);
        k.setTeamName((String) team.get("name"));

        Integer headcount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM team_members WHERE team_id = ?",
                Integer.class, teamId);
        k.setHeadcount(headcount);

        Number presentDays = jdbc.queryForObject(
                "SELECT COUNT(DISTINCT CONCAT(c.user_id,'#', DATE(c.`at`))) " +
                "FROM clocks c " +
                "JOIN team_members tm ON tm.user_id = c.user_id AND tm.team_id = ? " +
                "WHERE c.`at` BETWEEN ? AND ? AND c.kind='IN'",
                Number.class, teamId, start, end.plusDays(1));

        // plannedDays (chaîne SQL corrigée)
        Number plannedDays = jdbc.queryForObject(
                "WITH RECURSIVE d AS (" +
                "  SELECT ? AS dt UNION ALL " +
                "  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM d WHERE dt < ?" +
                ") " +
                "SELECT COUNT(*) FROM (" +
                "  SELECT DISTINCT ws.user_id, d.dt " +
                "  FROM d " +
                "  JOIN team_members tm ON tm.team_id = ? " +
                "  JOIN work_schedules ws ON ws.user_id = tm.user_id " +
                "     AND ws.day_of_week = " + weekdayEnumExpr("d.dt") +
                ") x",
                Number.class, start, end, teamId);
        k.setPresenceRate(ratio(presentDays, plannedDays));

        Number totalMinutes = jdbc.queryForObject(
                "SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, first_in, last_out)),0) FROM (" +
                "  SELECT c.user_id, DATE(c.`at`) d, " +
                "         MIN(CASE WHEN c.kind='IN' THEN c.`at` END) AS first_in, " +
                "         MAX(CASE WHEN c.kind='OUT' THEN c.`at` END) AS last_out " +
                "  FROM clocks c " +
                "  JOIN team_members tm ON tm.user_id = c.user_id AND tm.team_id = ? " +
                "  WHERE c.`at` BETWEEN ? AND ? " +
                "  GROUP BY c.user_id, DATE(c.`at`) " +
                "  HAVING first_in IS NOT NULL AND last_out IS NOT NULL" +
                ") t",
                Number.class, teamId, start, end.plusDays(1));

        Number dayCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM (" +
                "  SELECT c.user_id, DATE(c.`at`) d " +
                "  FROM clocks c " +
                "  JOIN team_members tm ON tm.user_id=c.user_id AND tm.team_id=? " +
                "  WHERE c.`at` BETWEEN ? AND ? " +
                "  GROUP BY c.user_id, DATE(c.`at`)" +
                ") s",
                Number.class, teamId, start, end.plusDays(1));

        BigDecimal avgHours = (nz(totalMinutes)
                .divide(new BigDecimal(dayCount == null ? 1 : dayCount.longValue()), 2, java.math.RoundingMode.HALF_UP))
                .divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
        k.setAvgHoursPerDay(avgHours);

        Number absenceDays = jdbc.queryForObject(
                "SELECT COALESCE(SUM(CASE ad.period " +
                " WHEN 'FULL_DAY' THEN 1 WHEN 'AM' THEN 0.5 WHEN 'PM' THEN 0.5 END),0) " +
                "FROM absence_days ad " +
                "JOIN absence a ON a.id = ad.absence_id " +
                "JOIN team_members tm ON tm.user_id = a.user_id AND tm.team_id = ? " +
                "WHERE ad.absence_date BETWEEN ? AND ?",
                Number.class, teamId, start, end);
        k.setAbsenceRate(ratio(absenceDays, plannedDays));

        Integer reports = jdbc.queryForObject(
                "SELECT COUNT(*) " +
                "FROM reports r " +
                "JOIN team_members tm ON tm.user_id = r.author_id " +
                "WHERE tm.team_id = ? AND r.created_at BETWEEN ? AND ?",
                Integer.class, teamId, start.atStartOfDay(), end.plusDays(1).atStartOfDay());
        k.setReportsAuthored(reports);

        return k;
    }

    // -------------------- User --------------------
    @Transactional(readOnly = true)
    public UserKpiSummary getUser(UUID userId, LocalDate start, LocalDate end) {
        UserKpiSummary k = new UserKpiSummary();
        k.setUserId(userId);
        k.setPeriodStart(start);
        k.setPeriodEnd(end);

        Map<String, Object> u = jdbc.queryForMap(
                "SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM users WHERE id = ?",
                userId.toString());
        k.setFullName((String) u.get("full_name"));

        Number presentDays = jdbc.queryForObject(
                "SELECT COUNT(DISTINCT DATE(`at`)) " +
                "FROM clocks WHERE user_id = ? AND `at` BETWEEN ? AND ? AND kind='IN'",
                Number.class, userId.toString(), start, end.plusDays(1));

        Number plannedDays = jdbc.queryForObject(
                "WITH RECURSIVE d AS (" +
                "  SELECT ? AS dt UNION ALL " +
                "  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM d WHERE dt < ?" +
                ") " +
                "SELECT COUNT(*) FROM (" +
                "  SELECT DISTINCT d.dt " +
                "  FROM d " +
                "  JOIN work_schedules ws ON ws.user_id = ? " +
                "     AND ws.day_of_week = " + weekdayEnumExpr("d.dt") +
                ") x",
                Number.class, start, end, userId.toString());
        k.setPresenceRate(ratio(presentDays, plannedDays));

        Number totalMinutes = jdbc.queryForObject(
                "SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, first_in, last_out)),0) FROM (" +
                "  SELECT DATE(`at`) d, " +
                "         MIN(CASE WHEN kind='IN' THEN `at` END) AS first_in, " +
                "         MAX(CASE WHEN kind='OUT' THEN `at` END) AS last_out " +
                "  FROM clocks " +
                "  WHERE user_id = ? AND `at` BETWEEN ? AND ? " +
                "  GROUP BY DATE(`at`) " +
                "  HAVING first_in IS NOT NULL AND last_out IS NOT NULL" +
                ") t",
                Number.class, userId.toString(), start, end.plusDays(1));

        Number dayCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM (" +
                "  SELECT DATE(`at`) d " +
                "  FROM clocks WHERE user_id=? AND `at` BETWEEN ? AND ? " +
                "  GROUP BY DATE(`at`)" +
                ") s",
                Number.class, userId.toString(), start, end.plusDays(1));

        BigDecimal avgHours = (nz(totalMinutes)
                .divide(new BigDecimal(dayCount == null ? 1 : dayCount.longValue()), 2, java.math.RoundingMode.HALF_UP))
                .divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
        k.setAvgHoursPerDay(avgHours);

        Number plannedMinutes = jdbc.queryForObject(
                "WITH RECURSIVE d AS (" +
                "  SELECT ? AS dt UNION ALL " +
                "  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM d WHERE dt < ?" +
                ") " +
                "SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, ws.start_time, ws.end_time)),0) " +
                "FROM d " +
                "JOIN work_schedules ws ON ws.user_id = ? " +
                "  AND ws.day_of_week = " + weekdayEnumExpr("d.dt"),
                Number.class, start, end, userId.toString());
        BigDecimal overtime = nz(totalMinutes)
                .subtract(nz(plannedMinutes))
                .divide(BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
        k.setOvertimeHours(overtime);

        Number lateCount = jdbc.queryForObject(
                "WITH RECURSIVE d AS (" +
                "  SELECT ? AS dt UNION ALL " +
                "  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM d WHERE dt < ?" +
                ") " +
                "SELECT COUNT(*) FROM (" +
                "  SELECT d.dt, " +
                "    (SELECT MIN(start_time) FROM work_schedules ws " +
                "     WHERE ws.user_id=? AND ws.day_of_week = " + weekdayEnumExpr("d.dt") + ") AS plan_start, " +
                "    (SELECT MIN(`at`) FROM clocks c " +
                "     WHERE c.user_id=? AND DATE(c.`at`)=d.dt AND c.kind='IN') AS first_in " +
                "  FROM d" +
                ") z " +
                "WHERE plan_start IS NOT NULL AND first_in IS NOT NULL AND TIME(first_in) > plan_start",
                Number.class, start, end, userId.toString(), userId.toString());
        BigDecimal lateRate = ratio(lateCount, plannedDays);

        Number avgDelayMin = jdbc.queryForObject(
                "WITH RECURSIVE d AS (" +
                "  SELECT ? AS dt UNION ALL " +
                "  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM d WHERE dt < ?" +
                ") " +
                "SELECT COALESCE(AVG(TIMESTAMPDIFF(MINUTE, plan_start, first_in)),0) FROM (" +
                "  SELECT d.dt, " +
                "    (SELECT MIN(start_time) FROM work_schedules ws " +
                "     WHERE ws.user_id=? AND ws.day_of_week = " + weekdayEnumExpr("d.dt") + ") AS plan_start, " +
                "    (SELECT MIN(`at`) FROM clocks c " +
                "     WHERE c.user_id=? AND DATE(c.`at`)=d.dt AND c.kind='IN') AS first_in " +
                "  FROM d" +
                ") z " +
                "WHERE plan_start IS NOT NULL AND first_in IS NOT NULL AND TIME(first_in) > plan_start",
                Number.class, start, end, userId.toString(), userId.toString());
        k.setPunctuality(new PunctualityStats(lateRate, nz(avgDelayMin)));

        Number absDays = jdbc.queryForObject(
                "SELECT COALESCE(SUM(CASE period " +
                " WHEN 'FULL_DAY' THEN 1 WHEN 'AM' THEN 0.5 WHEN 'PM' THEN 0.5 END),0) " +
                "FROM absence_days ad " +
                "JOIN absence a ON a.id=ad.absence_id " +
                "WHERE a.user_id=? AND ad.absence_date BETWEEN ? AND ?",
                Number.class, userId.toString(), start, end);
        k.setAbsenceDays(nz(absDays));

        List<AbsenceBreakdown> byType = jdbc.query(
                "SELECT a.type, " +
                "       SUM(CASE ad.period WHEN 'FULL_DAY' THEN 1 WHEN 'AM' THEN 0.5 WHEN 'PM' THEN 0.5 END) AS days " +
                "FROM absence a " +
                "JOIN absence_days ad ON a.id=ad.absence_id " +
                "WHERE a.user_id=? AND ad.absence_date BETWEEN ? AND ? " +
                "GROUP BY a.type",
                (rs, i) -> new AbsenceBreakdown(rs.getString("type"), rs.getBigDecimal("days")),
                userId.toString(), start, end);
        k.setAbsenceByType(byType);

        List<LeaveBalance> balances = jdbc.query(
                "SELECT la.leave_type, la.opening_balance, " +
                "       COALESCE(SUM(CASE ll.kind WHEN 'ACCRUAL' THEN ll.amount END),0) AS accrued, " +
                "       COALESCE(SUM(CASE ll.kind WHEN 'DEBIT' THEN ll.amount END),0)   AS debited, " +
                "       COALESCE(SUM(CASE ll.kind WHEN 'ADJUSTMENT' THEN ll.amount END),0) AS adjustments, " +
                "       COALESCE(SUM(CASE ll.kind WHEN 'CARRYOVER_EXPIRE' THEN ll.amount END),0) AS expired " +
                "FROM leave_accounts la " +
                "LEFT JOIN leave_ledger ll ON ll.account_id = la.id AND ll.entry_date BETWEEN ? AND ? " +
                "WHERE la.user_id = ? " +
                "GROUP BY la.id, la.leave_type, la.opening_balance",
                new RowMapper<LeaveBalance>() {
                    @Override public LeaveBalance mapRow(ResultSet rs, int rowNum) throws SQLException {
                        BigDecimal opening = rs.getBigDecimal("opening_balance");
                        BigDecimal accrued = nz(rs.getBigDecimal("accrued"));
                        BigDecimal debited = nz(rs.getBigDecimal("debited"));
                        BigDecimal adjustments = nz(rs.getBigDecimal("adjustments"));
                        BigDecimal expired = nz(rs.getBigDecimal("expired"));
                        BigDecimal current = opening.add(accrued).add(adjustments).subtract(debited).subtract(expired);
                        return new LeaveBalance(
                                rs.getString("leave_type"),
                                opening, accrued, debited, adjustments, expired, current
                        );
                    }
                }, start, end, userId.toString());
        k.setLeaveBalances(balances);

        Integer authored = jdbc.queryForObject(
                "SELECT COUNT(*) FROM reports WHERE author_id=? AND created_at BETWEEN ? AND ?",
                Integer.class, userId.toString(), start.atStartOfDay(), end.plusDays(1).atStartOfDay());
        Integer received = jdbc.queryForObject(
                "SELECT COUNT(*) FROM reports WHERE target_user_id=? AND created_at BETWEEN ? AND ?",
                Integer.class, userId.toString(), start.atStartOfDay(), end.plusDays(1).atStartOfDay());
        k.setReportsAuthored(authored);
        k.setReportsReceived(received);

        return k;
    }
}