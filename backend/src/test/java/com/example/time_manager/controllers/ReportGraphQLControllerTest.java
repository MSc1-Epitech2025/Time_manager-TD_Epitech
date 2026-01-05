package com.example.time_manager.controllers;

import com.example.time_manager.dto.report.ReportCreateRequest;
import com.example.time_manager.dto.report.ReportResponse;
import com.example.time_manager.dto.report.ReportUpdateRequest;
import com.example.time_manager.graphql.controller.ReportGraphQLController;
import com.example.time_manager.service.ReportService;
import org.junit.jupiter.api.*;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ReportGraphQLControllerTest {

    @Mock private ReportService reportService;
    @Mock private Authentication auth;

    private ReportGraphQLController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        controller = new ReportGraphQLController(reportService);
        when(auth.getName()).thenReturn("john@example.com");
    }

    @Test
    void testReports_AdminListAll() {
        List<ReportResponse> mockList = List.of(new ReportResponse(), new ReportResponse());
        when(reportService.listAllForAdmin("john@example.com")).thenReturn(mockList);

        List<ReportResponse> result = controller.reports(auth);

        assertEquals(2, result.size());
        verify(reportService).listAllForAdmin("john@example.com");
    }

    @Test
    void testMyReports_ReturnsList() {
        List<ReportResponse> mockList = List.of(new ReportResponse());
        when(reportService.listAuthoredByEmail("john@example.com")).thenReturn(mockList);

        List<ReportResponse> result = controller.myReports(auth);

        assertEquals(1, result.size());
        verify(reportService).listAuthoredByEmail("john@example.com");
    }

    @Test
    void testReportsForMe_ReturnsList() {
        List<ReportResponse> mockList = List.of(new ReportResponse());
        when(reportService.listReceivedByEmail("john@example.com")).thenReturn(mockList);

        List<ReportResponse> result = controller.reportsForMe(auth);

        assertEquals(1, result.size());
        verify(reportService).listReceivedByEmail("john@example.com");
    }

    @Test
    void testReport_ReturnsById() {
        ReportResponse mockReport = new ReportResponse();
        when(reportService.getVisibleTo("john@example.com", 5L)).thenReturn(mockReport);

        ReportResponse result = controller.report(5L, auth);

        assertNotNull(result);
        verify(reportService).getVisibleTo("john@example.com", 5L);
    }

    @Test
    void testCreateReport_Success() {
        ReportCreateRequest input = new ReportCreateRequest();
        ReportResponse expected = new ReportResponse();

        when(reportService.createForAuthorEmail("john@example.com", input)).thenReturn(expected);

        ReportResponse result = controller.createReport(input, auth);

        assertSame(expected, result);
        verify(reportService).createForAuthorEmail("john@example.com", input);
    }

    @Test
    void testUpdateReport_Success() {
        ReportUpdateRequest input = new ReportUpdateRequest();
        ReportResponse expected = new ReportResponse();

        when(reportService.updateVisibleTo("john@example.com", 10L, input)).thenReturn(expected);

        ReportResponse result = controller.updateReport(10L, input, auth);

        assertSame(expected, result);
        verify(reportService).updateVisibleTo("john@example.com", 10L, input);
    }

    @Test
    void testDeleteReport_Success() {
        Boolean result = controller.deleteReport(3L, auth);

        assertTrue(result);
        verify(reportService).deleteVisibleTo("john@example.com", 3L);
    }

    @Test
    void testReport_ServiceThrowsException_Propagates() {
        when(reportService.getVisibleTo("john@example.com", 5L))
                .thenThrow(new RuntimeException("Not allowed"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> controller.report(5L, auth));

        assertEquals("Not allowed", ex.getMessage());
        verify(reportService).getVisibleTo("john@example.com", 5L);
    }

    @Test
    void testCreateReport_ServiceThrowsException_Propagates() {
        ReportCreateRequest req = new ReportCreateRequest();
        when(reportService.createForAuthorEmail("john@example.com", req))
                .thenThrow(new RuntimeException("Create error"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> controller.createReport(req, auth));

        assertEquals("Create error", ex.getMessage());
        verify(reportService).createForAuthorEmail("john@example.com", req);
    }
}
