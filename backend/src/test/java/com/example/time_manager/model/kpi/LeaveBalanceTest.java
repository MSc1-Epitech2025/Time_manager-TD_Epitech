package com.example.time_manager.model.kpi;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class LeaveBalanceTest {

    @Test
    void testNoArgsConstructorAndSetters() {
        LeaveBalance lb = new LeaveBalance();

        lb.setLeaveType("PAID");
        lb.setOpeningBalance(new BigDecimal("10"));
        lb.setAccrued(new BigDecimal("5"));
        lb.setDebited(new BigDecimal("2"));
        lb.setAdjustments(new BigDecimal("1"));
        lb.setExpired(new BigDecimal("0"));
        lb.setCurrentBalance(new BigDecimal("14"));

        assertThat(lb.getLeaveType()).isEqualTo("PAID");
        assertThat(lb.getOpeningBalance()).isEqualByComparingTo("10");
        assertThat(lb.getAccrued()).isEqualByComparingTo("5");
        assertThat(lb.getDebited()).isEqualByComparingTo("2");
        assertThat(lb.getAdjustments()).isEqualByComparingTo("1");
        assertThat(lb.getExpired()).isEqualByComparingTo("0");
        assertThat(lb.getCurrentBalance()).isEqualByComparingTo("14");
    }

    @Test
    void testAllArgsConstructor() {
        LeaveBalance lb = new LeaveBalance(
                "RTT",
                new BigDecimal("20"),
                new BigDecimal("3"),
                new BigDecimal("4"),
                new BigDecimal("1"),
                new BigDecimal("2"),
                new BigDecimal("18")
        );

        assertThat(lb.getLeaveType()).isEqualTo("RTT");
        assertThat(lb.getOpeningBalance()).isEqualByComparingTo("20");
        assertThat(lb.getAccrued()).isEqualByComparingTo("3");
        assertThat(lb.getDebited()).isEqualByComparingTo("4");
        assertThat(lb.getAdjustments()).isEqualByComparingTo("1");
        assertThat(lb.getExpired()).isEqualByComparingTo("2");
        assertThat(lb.getCurrentBalance()).isEqualByComparingTo("18");
    }

    @Test
    void testModifyValues() {
        LeaveBalance lb = new LeaveBalance(
                "VACATION",
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        lb.setLeaveType("UNPAID");
        lb.setOpeningBalance(new BigDecimal("5"));
        lb.setAccrued(new BigDecimal("2"));
        lb.setDebited(new BigDecimal("1"));
        lb.setAdjustments(new BigDecimal("0"));
        lb.setExpired(new BigDecimal("0"));
        lb.setCurrentBalance(new BigDecimal("6"));

        assertThat(lb.getLeaveType()).isEqualTo("UNPAID");
        assertThat(lb.getCurrentBalance()).isEqualByComparingTo("6");
    }
}
