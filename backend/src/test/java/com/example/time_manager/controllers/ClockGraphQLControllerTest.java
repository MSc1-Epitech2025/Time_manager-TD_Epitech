package com.example.time_manager.controllers;

import com.example.time_manager.dto.clock.ClockCreateRequest;
import com.example.time_manager.dto.clock.ClockResponse;
import com.example.time_manager.graphql.controller.ClockGraphQLController;
import com.example.time_manager.model.ClockKind;
import com.example.time_manager.service.ClockService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ClockGraphQLControllerTest {

    @Mock
    private ClockService clockService;

    private ClockGraphQLController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        controller = new ClockGraphQLController(clockService);
    }

    @Test
    void testMyClocks_WithDateRange() {
        Authentication auth = new TestingAuthenticationToken("john@example.com", "pass");
        List<ClockResponse> expected = List.of(new ClockResponse(), new ClockResponse());

        Instant from = Instant.parse("2024-01-01T00:00:00Z");
        Instant to = Instant.parse("2024-12-31T23:59:59Z");

        when(clockService.listForEmail("john@example.com", from, to)).thenReturn(expected);

        List<ClockResponse> result =
                controller.myClocks("2024-01-01T00:00:00Z", "2024-12-31T23:59:59Z", auth);

        assertEquals(2, result.size());
        verify(clockService).listForEmail("john@example.com", from, to);
    }

    @Test
    void testMyClocks_WithoutDateRange() {
        Authentication auth = new TestingAuthenticationToken("john@example.com", "pass");
        List<ClockResponse> expected = List.of(new ClockResponse());

        when(clockService.listForEmail("john@example.com", null, null)).thenReturn(expected);

        List<ClockResponse> result = controller.myClocks(null, null, auth);

        assertEquals(1, result.size());
        verify(clockService).listForEmail("john@example.com", null, null);
    }

    @Test
    void testClocksForUser_WithDates() {
        List<ClockResponse> mockList = List.of(new ClockResponse(), new ClockResponse());
        Instant from = Instant.parse("2025-01-01T00:00:00Z");
        Instant to = Instant.parse("2025-01-31T23:59:59Z");

        when(clockService.listForUser("U1", from, to)).thenReturn(mockList);

        List<ClockResponse> result =
                controller.clocksForUser("U1", "2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z");

        assertEquals(2, result.size());
        verify(clockService).listForUser("U1", from, to);
    }

    @Test
    void testClocksForUser_WithoutDates() {
        List<ClockResponse> mockList = List.of(new ClockResponse());
        when(clockService.listForUser("U2", null, null)).thenReturn(mockList);

        List<ClockResponse> result = controller.clocksForUser("U2", null, null);

        assertEquals(1, result.size());
        verify(clockService).listForUser("U2", null, null);
    }

    @Test
    void testCreateClockForMe_Success() {
        Authentication auth = new TestingAuthenticationToken("john@example.com", "pass");

        ClockCreateRequest input = new ClockCreateRequest(
                ClockKind.IN,
                Instant.parse("2024-05-01T08:00:00Z")
        );

        ClockResponse expected = new ClockResponse();
        when(clockService.createForMe("john@example.com", input)).thenReturn(expected);

        ClockResponse result = controller.createClockForMe(input, auth);

        assertEquals(expected, result);
        verify(clockService).createForMe("john@example.com", input);
    }

    @Test
    void testCreateClockForUser_Success() {
        ClockCreateRequest input = new ClockCreateRequest(
                ClockKind.OUT,
                Instant.parse("2024-05-01T17:00:00Z")
        );

        ClockResponse expected = new ClockResponse();
        when(clockService.createForUser("U1", input)).thenReturn(expected);

        ClockResponse result = controller.createClockForUser("U1", input);

        assertEquals(expected, result);
        verify(clockService).createForUser("U1", input);
    }

    @Test
    void testHandleIllegalState_ReturnsMessage() {
        String result = controller.handleIllegalState(new IllegalStateException("Clock overlap"));
        assertEquals("Erreur: Clock overlap", result);
    }

    @Test
    void testHandleNotFound_ReturnsNotFound() {
        String result = controller.handleNotFound(new EntityNotFoundException("not found"));
        assertEquals("Not found", result);
    }
}
