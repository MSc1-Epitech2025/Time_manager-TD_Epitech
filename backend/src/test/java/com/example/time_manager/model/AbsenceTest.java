package com.example.time_manager.model;

import com.example.time_manager.model.absence.Absence;
import com.example.time_manager.model.absence.AbsenceDay;
import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.model.absence.AbsenceType;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AbsenceTest {

    @Test
    void testGettersAndSetters() {
        Absence a = new Absence();

        a.setId(10L);
        a.setUserId("U123");
        a.setStartDate(LocalDate.of(2024, 1, 1));
        a.setEndDate(LocalDate.of(2024, 1, 5));
        a.setType(AbsenceType.SICK);
        a.setReason("Flu");
        a.setSupportingDocumentUrl("https://test.com/doc.pdf");
        a.setStatus(AbsenceStatus.APPROVED);
        a.setApprovedBy("ADMIN1");
        a.setApprovedAt(LocalDateTime.of(2024, 1, 2, 12, 0));

        assertThat(a.getId()).isEqualTo(10L);
        assertThat(a.getUserId()).isEqualTo("U123");
        assertThat(a.getStartDate()).isEqualTo(LocalDate.of(2024,1,1));
        assertThat(a.getEndDate()).isEqualTo(LocalDate.of(2024,1,5));
        assertThat(a.getType()).isEqualTo(AbsenceType.SICK);
        assertThat(a.getReason()).isEqualTo("Flu");
        assertThat(a.getSupportingDocumentUrl()).isEqualTo("https://test.com/doc.pdf");
        assertThat(a.getStatus()).isEqualTo(AbsenceStatus.APPROVED);
        assertThat(a.getApprovedBy()).isEqualTo("ADMIN1");
        assertThat(a.getApprovedAt()).isEqualTo(LocalDateTime.of(2024,1,2,12,0));
    }

    @Test
    void testSetAndGetDays() {
        Absence a = new Absence();

        AbsenceDay d1 = new AbsenceDay();
        AbsenceDay d2 = new AbsenceDay();

        List<AbsenceDay> days = List.of(d1, d2);
        a.setDays(days);

        assertThat(a.getDays()).hasSize(2);
        assertThat(a.getDays()).containsExactly(d1, d2);
    }
}
