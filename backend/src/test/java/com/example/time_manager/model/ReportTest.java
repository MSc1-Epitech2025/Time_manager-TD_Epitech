package com.example.time_manager.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

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
}
