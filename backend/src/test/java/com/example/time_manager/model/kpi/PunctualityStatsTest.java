package com.example.time_manager.model.kpi;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;

class PunctualityStatsTest {

    @Test
    void testAllArgsConstructorAndGetters() {
        PunctualityStats stats = new PunctualityStats(
                new BigDecimal("25.0"),
                new BigDecimal("15.2")
        );

        assertThat(stats.getLateRate()).isEqualByComparingTo("25.0");
        assertThat(stats.getAvgDelayMinutes()).isEqualByComparingTo("15.2");
    }

    @Test
    void testSetters() {
        // On crée l'objet avec des valeurs initiales arbitraires
        PunctualityStats stats = new PunctualityStats(
                BigDecimal.ZERO,
                BigDecimal.ZERO
        );

        stats.setLateRate(new BigDecimal("10.5"));
        stats.setAvgDelayMinutes(new BigDecimal("7.3"));

        assertThat(stats.getLateRate()).isEqualByComparingTo("10.5");
        assertThat(stats.getAvgDelayMinutes()).isEqualByComparingTo("7.3");
    }

    @Test
    void testModifyValues() {
        PunctualityStats stats = new PunctualityStats(
                new BigDecimal("5.0"),
                new BigDecimal("3.0")
        );

        stats.setLateRate(new BigDecimal("12.0"));
        stats.setAvgDelayMinutes(new BigDecimal("6.0"));

        assertThat(stats.getLateRate()).isEqualByComparingTo("12.0");
        assertThat(stats.getAvgDelayMinutes()).isEqualByComparingTo("6.0");
    }
}
