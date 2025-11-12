package com.example.time_manager.model.kpi;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class AbsenceBreakdownTest {

    @Test
    void testNoArgsConstructorAndSetters() {
        AbsenceBreakdown ab = new AbsenceBreakdown();
        ab.setType("SICK");
        ab.setDays(new BigDecimal("2.5"));

        assertThat(ab.getType()).isEqualTo("SICK");
        assertThat(ab.getDays()).isEqualByComparingTo("2.5");
    }

    @Test
    void testAllArgsConstructorAndGetters() {
        AbsenceBreakdown ab = new AbsenceBreakdown("VACATION", new BigDecimal("1.0"));

        assertThat(ab.getType()).isEqualTo("VACATION");
        assertThat(ab.getDays()).isEqualByComparingTo("1.0");
    }

    @Test
    void testModifyValues() {
        AbsenceBreakdown ab = new AbsenceBreakdown("PERSONAL", BigDecimal.ZERO);
        ab.setType("RTT");
        ab.setDays(new BigDecimal("0.5"));

        assertThat(ab.getType()).isEqualTo("RTT");
        assertThat(ab.getDays()).isEqualByComparingTo("0.5");
    }
}
