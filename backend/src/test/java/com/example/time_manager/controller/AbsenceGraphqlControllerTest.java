package com.example.time_manager.controller;

import com.example.time_manager.dto.absence.AbsenceCreateRequest;
import com.example.time_manager.dto.absence.AbsenceResponse;
import com.example.time_manager.dto.absence.AbsenceStatusUpdateRequest;
import com.example.time_manager.dto.absence.AbsenceUpdateRequest;
import com.example.time_manager.graphql.controller.AbsenceGraphqlController;
import com.example.time_manager.graphql.controller.AbsenceGraphqlController.*;
import com.example.time_manager.model.absence.AbsencePeriod;
import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.model.absence.AbsenceType;
import com.example.time_manager.service.AbsenceService;
import org.junit.jupiter.api.*;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AbsenceGraphqlControllerTest {

    @Mock
    private AbsenceService absenceService;

    private AbsenceGraphqlController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        controller = new AbsenceGraphqlController(absenceService);
        SecurityContextHolder.clearContext();

        var auth = new TestingAuthenticationToken("john@example.com", "pass");
        auth.setAuthenticated(true);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testMyAbsences_Success() {
        List<AbsenceResponse> expected = List.of(new AbsenceResponse(), new AbsenceResponse());
        when(absenceService.listMine("john@example.com")).thenReturn(expected);

        List<AbsenceResponse> result = controller.myAbsences();

        assertEquals(2, result.size());
        verify(absenceService).listMine("john@example.com");
    }

    @Test
    void testAbsenceById_Success() {
        AbsenceResponse expected = new AbsenceResponse();
        when(absenceService.getVisibleTo("john@example.com", 5L)).thenReturn(expected);

        AbsenceResponse result = controller.absence(5L);

        assertEquals(expected, result);
        verify(absenceService).getVisibleTo("john@example.com", 5L);
    }

    @Test
    void testAbsencesByUser_Success() {
        List<AbsenceResponse> expected = List.of(new AbsenceResponse());
        when(absenceService.listForUser("U1")).thenReturn(expected);

        List<AbsenceResponse> result = controller.absencesByUser("U1");

        assertEquals(1, result.size());
        verify(absenceService).listForUser("U1");
    }

    @Test
    void testAllAbsences_Success() {
        List<AbsenceResponse> expected = List.of(new AbsenceResponse(), new AbsenceResponse());
        when(absenceService.listAll()).thenReturn(expected);

        List<AbsenceResponse> result = controller.allAbsences();

        assertEquals(2, result.size());
        verify(absenceService).listAll();
    }

    @Test
    void testMyTeamAbsences_Success() {
        List<AbsenceResponse> expected = List.of(new AbsenceResponse());
        when(absenceService.listTeamAbsences("john@example.com", 42L)).thenReturn(expected);

        List<AbsenceResponse> result = controller.myTeamAbsences(42L);

        assertEquals(1, result.size());
        verify(absenceService).listTeamAbsences("john@example.com", 42L);
    }

    @Test
    void testCreateAbsence_Success() {
        AbsenceCreateInput input = new AbsenceCreateInput();
        input.setStartDate("2024-04-01");
        input.setEndDate("2024-04-05");
        input.setType(AbsenceType.VACATION);
        input.setReason("Holiday");
        input.setSupportingDocumentUrl("http://doc.pdf");

        AbsenceGraphqlController.PeriodByDateInput period1 = new PeriodByDateInput();
        period1.setDate("2024-04-01");
        period1.setPeriod(AbsencePeriod.AM);
        input.setPeriodByDate(List.of(period1));

        AbsenceResponse expected = new AbsenceResponse();
        when(absenceService.createForEmail(eq("john@example.com"), any(AbsenceCreateRequest.class)))
                .thenReturn(expected);

        AbsenceResponse result = controller.createAbsence(input);

        assertEquals(expected, result);
        verify(absenceService).createForEmail(eq("john@example.com"), any(AbsenceCreateRequest.class));
    }

    @Test
    void testUpdateAbsence_Success() {
        AbsenceUpdateInput input = new AbsenceUpdateInput();
        input.setStartDate("2024-05-01");
        input.setEndDate("2024-05-03");
        input.setType(AbsenceType.SICK);
        input.setReason("Flu");
        input.setSupportingDocumentUrl("url");
        input.setPeriodByDate(List.of());

        AbsenceResponse expected = new AbsenceResponse();
        when(absenceService.updateVisibleTo(eq("john@example.com"), eq(5L), any(AbsenceUpdateRequest.class)))
                .thenReturn(expected);

        AbsenceResponse result = controller.updateAbsence(5L, input);

        assertEquals(expected, result);
        verify(absenceService).updateVisibleTo(eq("john@example.com"), eq(5L), any(AbsenceUpdateRequest.class));
    }

    @Test
    void testSetAbsenceStatus_Success() {
        AbsenceStatusUpdateInput input = new AbsenceStatusUpdateInput();
        input.setStatus(AbsenceStatus.APPROVED);

        AbsenceResponse expected = new AbsenceResponse();
        when(absenceService.setStatus(eq("john@example.com"), eq(10L), any(AbsenceStatusUpdateRequest.class)))
                .thenReturn(expected);

        AbsenceResponse result = controller.setAbsenceStatus(10L, input);

        assertEquals(expected, result);
        verify(absenceService).setStatus(eq("john@example.com"), eq(10L), any(AbsenceStatusUpdateRequest.class));
    }

    @Test
    void testDeleteAbsence_Success() {
        doNothing().when(absenceService).deleteVisibleTo("john@example.com", 77L);

        Boolean result = controller.deleteAbsence(77L);

        assertTrue(result);
        verify(absenceService).deleteVisibleTo("john@example.com", 77L);
    }

    @Test
    void testToMap_ConvertsListCorrectly() throws Exception {
        PeriodByDateInput p1 = new PeriodByDateInput();
        p1.setDate("2024-06-01");
        p1.setPeriod(AbsencePeriod.FULL_DAY);

        PeriodByDateInput p2 = new PeriodByDateInput();
        p2.setDate("2024-06-02");
        p2.setPeriod(AbsencePeriod.AM);

        Map<LocalDate, AbsencePeriod> result = invokeToMap(List.of(p1, p2));

        assertEquals(2, result.size());
        assertEquals(AbsencePeriod.FULL_DAY, result.get(LocalDate.parse("2024-06-01")));
    }

    private Map<LocalDate, AbsencePeriod> invokeToMap(List<PeriodByDateInput> input) throws Exception {
        var method = AbsenceGraphqlController.class.getDeclaredMethod("toMap", List.class);
        method.setAccessible(true);
        return (Map<LocalDate, AbsencePeriod>) method.invoke(null, input);
    }
}
