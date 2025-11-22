package com.example.time_manager.services;

import com.example.time_manager.model.kpi.*;
import com.example.time_manager.service.KpiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class KpiServiceTest {

    private JdbcTemplate jdbc;
    private KpiService service;

    @BeforeEach
    void setup() {
        jdbc = mock(JdbcTemplate.class);
        service = new KpiService(jdbc);
    }

    @Test
    void testNzHelper() throws Exception {
        var nz = KpiService.class.getDeclaredMethod("nz", Number.class);
        nz.setAccessible(true);

        assertEquals(BigDecimal.ZERO, nz.invoke(service, (Number) null));
        assertEquals(new BigDecimal("5"), nz.invoke(service, 5));
        assertEquals(new BigDecimal("3.14"), nz.invoke(service, 3.14));
    }

    @Test
    void testRatioHelper() throws Exception {
        var ratio = KpiService.class.getDeclaredMethod("ratio", Number.class, Number.class);
        ratio.setAccessible(true);

        assertEquals(BigDecimal.ZERO, ratio.invoke(service, 10, 0));
        assertEquals(new BigDecimal("50.00"), ratio.invoke(service, 1, 2));
        assertEquals(new BigDecimal("33.33"), ratio.invoke(service, 1, 3));
    }

    @Test
    void testGetGlobal() {

        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate end   = LocalDate.of(2024, 1, 31);

        when(jdbc.queryForObject(contains("SELECT COUNT(*) FROM users"), eq(Integer.class)))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("manager"), eq(Integer.class)))
                .thenReturn(2);

        when(jdbc.queryForObject(contains("admin"), eq(Integer.class)))
                .thenReturn(1);

        when(jdbc.queryForObject(contains("DISTINCT CONCAT"), eq(Number.class), any(), any()))
                .thenReturn(50);

        when(jdbc.queryForObject(contains("WITH RECURSIVE d"), eq(Number.class), any(), any()))
                .thenReturn(100);

        when(jdbc.queryForObject(contains("SUM(TIMESTAMPDIFF"), eq(Number.class), any(), any()))
                .thenReturn(3000);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM ("), eq(Number.class), any(), any()))
                .thenReturn(50);

        when(jdbc.queryForObject(contains("absence_days"), eq(Number.class), any(), any()))
                .thenReturn(20);

        when(jdbc.queryForObject(contains("approved_at"), eq(Number.class), any(), any()))
                .thenReturn(12);

        when(jdbc.queryForObject(contains("FROM reports"), eq(Integer.class), any(), any()))
                .thenReturn(8);

        GlobalKpiSummary k = service.getGlobal(start, end);

        assertNotNull(k);
        assertEquals(10, k.getHeadcount());
        assertEquals(start, k.getPeriodStart());
        assertEquals(end,   k.getPeriodEnd());

        assertEquals(new BigDecimal("20.00"), k.getManagersShare());
        assertEquals(new BigDecimal("10.00"), k.getAdminsShare());

        assertEquals(new BigDecimal("50.00"), k.getPresenceRate());

        assertEquals(new BigDecimal("1.00"), k.getAvgHoursPerDay());
        assertEquals(new BigDecimal("20"), k.getTotalAbsenceDays());
        assertEquals(new BigDecimal("20.00"), k.getAbsenceRate());

        assertEquals(new BigDecimal("12"), k.getApprovalDelayHours());
        assertEquals(8, k.getTotalReports());
    }

    @Test
    void testGetTeam() {

        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate end   = LocalDate.of(2024, 1, 31);

        when(jdbc.queryForMap(contains("FROM teams"), any()))
                .thenReturn(Map.of("name", "DevTeam"));

        when(jdbc.queryForObject(contains("team_members"), eq(Integer.class), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(contains("DISTINCT CONCAT"), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("WITH RECURSIVE d"), eq(Number.class), any(), any(), any()))
                .thenReturn(20);

        when(jdbc.queryForObject(contains("SUM(TIMESTAMPDIFF"), eq(Number.class), any(), any(), any()))
                .thenReturn(600);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM ("), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("absence_days"), eq(Number.class), any(), any(), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM reports"), eq(Integer.class), any(), any(), any()))
                .thenReturn(3);

        TeamKpiSummary k = service.getTeam(7, start, end);

        assertEquals("DevTeam", k.getTeamName());
        assertEquals(5, k.getHeadcount());
        assertEquals(new BigDecimal("50.00"), k.getPresenceRate());
        assertEquals(new BigDecimal("1.00"), k.getAvgHoursPerDay());
        assertEquals(new BigDecimal("25.00"), k.getAbsenceRate());
        assertEquals(3, k.getReportsAuthored());
    }

    @Test
    void testGetUser() {

        UUID uid = UUID.randomUUID();
        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate end   = LocalDate.of(2024, 1, 31);

        when(jdbc.queryForMap(contains("FROM users WHERE id"), any()))
                .thenReturn(Map.of("full_name", "Alice Smith"));

        when(jdbc.queryForObject(contains("DISTINCT DATE"), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("WITH RECURSIVE d"), eq(Number.class), any(), any(), any()))
                .thenReturn(20);

        when(jdbc.queryForObject(contains("SUM(TIMESTAMPDIFF"), eq(Number.class), any(), any(), any()))
                .thenReturn(600);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM ("), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(
                contains("SUM(CASE period"),
                eq(Number.class),
                any(), any(), any()
        )).thenReturn(5);

        when(jdbc.query(
                contains("GROUP BY a.type"),
                any(RowMapper.class),
                any(), any(), any()
        )).thenReturn(List.of(
                new AbsenceBreakdown("SICK", new BigDecimal("3"))
        ));

        when(jdbc.query(
                contains("leave_accounts"),
                any(RowMapper.class),
                any(), any(), any()
        )).thenReturn(List.of(new LeaveBalance("CP",
                BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.TEN)));

        when(jdbc.queryForObject(contains("author_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(2);

        when(jdbc.queryForObject(contains("target_user_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(1);

        UserKpiSummary k = service.getUser(uid, start, end);

        assertEquals("Alice Smith", k.getFullName());
        assertEquals(new BigDecimal("50.00"), k.getPresenceRate());
        assertEquals(new BigDecimal("1.00"), k.getAvgHoursPerDay());
        assertEquals(new BigDecimal("5"), k.getAbsenceDays());
        assertEquals(1, k.getAbsenceByType().size());
        assertEquals(2, k.getReportsAuthored());
        assertEquals(1, k.getReportsReceived());
    }

    @Test
    void testBigDecimalDivision_dayCountNull() throws Exception {
        var method = KpiService.class.getDeclaredMethod("ratio", Number.class, Number.class);
        method.setAccessible(true);

        BigDecimal result = (BigDecimal) method.invoke(service, 10, null);

        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    void testBigDecimalDivision_dayCountNotNull() throws Exception {
        var method = KpiService.class.getDeclaredMethod("ratio", Number.class, Number.class);
        method.setAccessible(true);

        BigDecimal result = (BigDecimal) method.invoke(service, 10, 4);

        assertEquals(new BigDecimal("250.00"), result);
    }

    @Test
    void testLeaveBalanceAndAbsenceBreakdownViaGetUser() {

        UUID uid = UUID.randomUUID();
        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate end   = LocalDate.of(2024, 1, 31);

        when(jdbc.queryForMap(contains("FROM users WHERE id"), any()))
                .thenReturn(Map.of("full_name", "Alice Smith"));

        when(jdbc.queryForObject(contains("DISTINCT DATE"), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("WITH RECURSIVE d"), eq(Number.class), any(), any(), any()))
                .thenReturn(20);

        when(jdbc.queryForObject(contains("SUM(TIMESTAMPDIFF"), eq(Number.class), any(), any(), any()))
                .thenReturn(600);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM ("), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("SUM(CASE period"), eq(Number.class), any(), any(), any()))
                .thenReturn(5);

        when(jdbc.query(
                contains("GROUP BY a.type"),
                any(RowMapper.class),
                any(), any(), any()
        )).thenReturn(List.of(
                new AbsenceBreakdown("SICK", new BigDecimal("3")),
                new AbsenceBreakdown("VAC", new BigDecimal("1.5"))
        ));

        when(jdbc.query(
                contains("leave_accounts"),
                any(RowMapper.class),
                any(), any(), any()
        )).thenReturn(List.of(
                new LeaveBalance("CP",
                        BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE,
                        BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("10")),
                new LeaveBalance("RTT",
                        new BigDecimal("5"), new BigDecimal("3"), new BigDecimal("1"),
                        new BigDecimal("1"), new BigDecimal("0"), new BigDecimal("7"))
        ));

        when(jdbc.queryForObject(contains("author_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(2);

        when(jdbc.queryForObject(contains("target_user_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(1);

        UserKpiSummary k = service.getUser(uid, start, end);

        assertEquals("Alice Smith", k.getFullName());

        assertEquals(2, k.getAbsenceByType().size());
        assertEquals("VAC", k.getAbsenceByType().get(1).getType());
        assertEquals(new BigDecimal("1.5"), k.getAbsenceByType().get(1).getDays());

        assertEquals(2, k.getLeaveBalances().size());
        assertEquals("RTT", k.getLeaveBalances().get(1).getLeaveType());
        assertEquals(new BigDecimal("7"), k.getLeaveBalances().get(1).getCurrentBalance());
    }

    @Test
    void testAbsenceBreakdownRowMapperExecution() throws Exception {
        UUID uid = UUID.randomUUID();
        LocalDate start = LocalDate.of(2024,1,1);
        LocalDate end = LocalDate.of(2024,1,31);

        when(jdbc.queryForMap(anyString(), any()))
                .thenReturn(Map.of("full_name", "Test User"));

        when(jdbc.queryForObject(contains("DISTINCT DATE"), eq(Number.class), any(), any(), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(contains("WITH RECURSIVE d"), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("SUM(TIMESTAMPDIFF"), eq(Number.class), any(), any(), any()))
                .thenReturn(600);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM ("), eq(Number.class), any(), any(), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(contains("SUM(CASE period"), eq(Number.class), any(), any(), any()))
                .thenReturn(2);

        when(jdbc.query(
                contains("GROUP BY a.type"),
                any(RowMapper.class),
                any(), any(), any()
        )).thenAnswer(invocation -> {
            RowMapper<AbsenceBreakdown> mapper = invocation.getArgument(1);
            ResultSet rs = mock(ResultSet.class);
            when(rs.getString("type")).thenReturn("SICK");
            when(rs.getBigDecimal("days")).thenReturn(new BigDecimal("2.5"));

            return List.of(mapper.mapRow(rs, 0));
        });

        when(jdbc.query(contains("leave_accounts"), any(RowMapper.class), any(), any(), any()))
                .thenReturn(List.of());

        when(jdbc.queryForObject(contains("author_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(1);

        when(jdbc.queryForObject(contains("target_user_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(1);

        UserKpiSummary k = service.getUser(uid, start, end);

        assertEquals("SICK", k.getAbsenceByType().get(0).getType());
        assertEquals(new BigDecimal("2.5"), k.getAbsenceByType().get(0).getDays());
    }

    @Test
    void testLeaveBalanceRowMapperExecution() {

        UUID uid = UUID.randomUUID();
        LocalDate start = LocalDate.now();
        LocalDate end = LocalDate.now();

        when(jdbc.queryForMap(anyString(), any()))
                .thenReturn(Map.of("full_name", "Tester"));

        when(jdbc.queryForObject(contains("DISTINCT DATE"), eq(Number.class), any(), any(), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(contains("WITH RECURSIVE d"), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("SUM(TIMESTAMPDIFF"), eq(Number.class), any(), any(), any()))
                .thenReturn(600);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM ("), eq(Number.class), any(), any(), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(contains("SUM(CASE period"), eq(Number.class), any(), any(), any()))
                .thenReturn(2);

        when(jdbc.query(
                contains("GROUP BY a.type"),
                any(RowMapper.class),
                any(), any(), any()
        )).thenReturn(List.of());

        when(jdbc.query(
                contains("leave_accounts"),
                any(RowMapper.class),
                any(), any(), any()
        )).thenAnswer(invocation -> {
            RowMapper<LeaveBalance> mapper = invocation.getArgument(1);

            ResultSet rs = mock(ResultSet.class);
            when(rs.getString("leave_type")).thenReturn("CP");
            when(rs.getBigDecimal("opening_balance")).thenReturn(new BigDecimal("10"));
            when(rs.getBigDecimal("accrued")).thenReturn(new BigDecimal("3"));
            when(rs.getBigDecimal("debited")).thenReturn(new BigDecimal("2"));
            when(rs.getBigDecimal("adjustments")).thenReturn(new BigDecimal("1"));
            when(rs.getBigDecimal("expired")).thenReturn(BigDecimal.ZERO);

            LeaveBalance lb = mapper.mapRow(rs, 0);
            return List.of(lb);
        });

        when(jdbc.queryForObject(contains("author_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(1);

        when(jdbc.queryForObject(contains("target_user_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(1);

        UserKpiSummary summary = service.getUser(uid, start, end);

        LeaveBalance lb = summary.getLeaveBalances().get(0);

        assertEquals("CP", lb.getLeaveType());
        assertEquals(new BigDecimal("12"), lb.getCurrentBalance());
    }

    @Test
    void testDivisionByDayCountNullInGetUser() {
        UUID uid = UUID.randomUUID();
        LocalDate start = LocalDate.of(2024,1,1);
        LocalDate end = LocalDate.of(2024,1,31);

        when(jdbc.queryForMap(anyString(), any()))
                .thenReturn(Map.of("full_name","Test"));

        when(jdbc.queryForObject(contains("DISTINCT DATE"), eq(Number.class), any(), any(), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(contains("WITH RECURSIVE d"), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("SUM(TIMESTAMPDIFF"), eq(Number.class), any(), any(), any()))
                .thenReturn(600);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM ("), eq(Number.class), any(), any(), any()))
                .thenReturn(null);

        when(jdbc.queryForObject(contains("SUM(CASE period"), eq(Number.class), any(), any(), any()))
                .thenReturn(3);

        when(jdbc.query(anyString(), any(RowMapper.class), any(), any(), any()))
                .thenReturn(List.of());

        when(jdbc.queryForObject(contains("author_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(1);

        when(jdbc.queryForObject(contains("target_user_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(1);

        UserKpiSummary summary = service.getUser(uid, start, end);

        assertNotNull(summary.getAvgHoursPerDay());
    }

    @Test
    void testDayCountNotNullInGetUser_overtimeBranch() {
        UUID uid = UUID.randomUUID();
        LocalDate start = LocalDate.of(2024,1,1);
        LocalDate end = LocalDate.of(2024,1,31);

        when(jdbc.queryForMap(anyString(), any()))
                .thenReturn(Map.of("full_name","Test"));

        when(jdbc.queryForObject(contains("DISTINCT DATE"), eq(Number.class), any(), any(), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(contains("WITH RECURSIVE d"), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("SUM(TIMESTAMPDIFF"), eq(Number.class), any(), any(), any()))
                .thenReturn(600);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM ("), eq(Number.class), any(), any(), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(contains("SUM(CASE period"), eq(Number.class), any(), any(), any()))
                .thenReturn(3);

        when(jdbc.queryForObject(
                contains("SUM(TIMESTAMPDIFF(MINUTE, ws.start_time, ws.end_time))"),
                eq(Number.class),
                any(), any(), any()
        )).thenReturn(300);

        when(jdbc.query(anyString(), any(RowMapper.class), any(), any(), any()))
                .thenReturn(List.of());

        when(jdbc.queryForObject(contains("author_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(1);

        when(jdbc.queryForObject(contains("target_user_id"), eq(Integer.class), any(), any(), any()))
                .thenReturn(1);

        UserKpiSummary k = service.getUser(uid, start, end);

        assertEquals(new BigDecimal("5.00"), k.getOvertimeHours());
    }

    @Test
    void testGetGlobal_dayCountNull_usesDivisorOne() {

        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate end   = LocalDate.of(2024, 1, 31);

        when(jdbc.queryForObject(contains("SELECT COUNT(*) FROM users"), eq(Integer.class)))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("manager"), eq(Integer.class)))
                .thenReturn(2);

        when(jdbc.queryForObject(contains("admin"), eq(Integer.class)))
                .thenReturn(1);

        when(jdbc.queryForObject(contains("DISTINCT CONCAT"), eq(Number.class), any(), any()))
                .thenReturn(50);

        when(jdbc.queryForObject(contains("WITH RECURSIVE d"), eq(Number.class), any(), any()))
                .thenReturn(100);

        when(jdbc.queryForObject(contains("SUM(TIMESTAMPDIFF"), eq(Number.class), any(), any()))
                .thenReturn(3000);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM ("), eq(Number.class), any(), any()))
                .thenReturn(null);

        when(jdbc.queryForObject(contains("absence_days"), eq(Number.class), any(), any()))
                .thenReturn(20);

        when(jdbc.queryForObject(contains("approved_at"), eq(Number.class), any(), any()))
                .thenReturn(12);

        when(jdbc.queryForObject(contains("FROM reports"), eq(Integer.class), any(), any()))
                .thenReturn(8);

        GlobalKpiSummary k = service.getGlobal(start, end);

        assertEquals(new BigDecimal("50.00"), k.getAvgHoursPerDay());
    }

    @Test
    void testGetTeam_dayCountNull_usesDivisorOne() {

        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate end   = LocalDate.of(2024, 1, 31);

        when(jdbc.queryForMap(contains("FROM teams"), any()))
                .thenReturn(Map.of("name", "DevTeam"));

        when(jdbc.queryForObject(contains("team_members"), eq(Integer.class), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(contains("DISTINCT CONCAT"), eq(Number.class), any(), any(), any()))
                .thenReturn(10);

        when(jdbc.queryForObject(contains("WITH RECURSIVE d"), eq(Number.class), any(), any(), any()))
                .thenReturn(20);

        when(jdbc.queryForObject(contains("SUM(TIMESTAMPDIFF"), eq(Number.class), any(), any(), any()))
                .thenReturn(600);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM ("), eq(Number.class), any(), any(), any()))
                .thenReturn(null);

        when(jdbc.queryForObject(contains("absence_days"), eq(Number.class), any(), any(), any()))
                .thenReturn(5);

        when(jdbc.queryForObject(startsWith("SELECT COUNT(*) FROM reports"), eq(Integer.class), any(), any(), any()))
                .thenReturn(3);

        TeamKpiSummary k = service.getTeam(7, start, end);

        assertEquals(new BigDecimal("10.00"), k.getAvgHoursPerDay());
    }
}