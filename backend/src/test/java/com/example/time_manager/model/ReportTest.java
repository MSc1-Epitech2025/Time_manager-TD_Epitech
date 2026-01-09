package com.example.time_manager.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import java.lang.reflect.Method;
import java.time.Instant;

class ReportTest {

    @Test
    void getRuleKey_shouldReturnRuleKey() {
        Report report = new Report();
        report.setRuleKey("test-rule-key-123");

        String result = report.getRuleKey();

        assertThat(result).isEqualTo("test-rule-key-123");
    }

    @Test
    void getRuleKey_shouldReturnNull_whenNotSet() {
        Report report = new Report();

        String result = report.getRuleKey();

        assertThat(result).isNull();
    }

    @Test
    void onCreate_shouldSetCreatedAt_whenNull() throws Exception {
        Report report = new Report();

        assertThat(report.getCreatedAt()).isNull();

        Method onCreate = Report.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(report);

        assertThat(report.getCreatedAt()).isNotNull();
    }

    @Test
    void onCreate_shouldNotOverrideCreatedAt_whenAlreadySet() throws Exception {
        Report report = new Report();
        Instant fixedInstant = Instant.parse("2024-01-01T10:00:00Z");
        report.setCreatedAt(fixedInstant);

        Method onCreate = Report.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(report);

        assertThat(report.getCreatedAt()).isEqualTo(fixedInstant);
    }
}
