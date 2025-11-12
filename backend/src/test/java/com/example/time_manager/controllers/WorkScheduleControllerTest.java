package com.example.time_manager.controllers;

import com.example.time_manager.dto.work_schedule.WorkScheduleBatchRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleResponse;
import com.example.time_manager.graphql.controller.WorkScheduleController;
import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.security.WorkScheduleAccess;
import com.example.time_manager.service.WorkScheduleService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WorkScheduleControllerTest {

    @Mock private WorkScheduleService workScheduleService;
    @Mock private UserRepository userRepository;
    @Mock private WorkScheduleAccess access;

    private WorkScheduleController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        controller = new WorkScheduleController(workScheduleService, userRepository, access);
        SecurityContextHolder.clearContext();
    }

    /* ======================= QUERIES ======================= */

    @Test
    void testWorkSchedulesByUser_ReturnsList() {
        List<WorkScheduleResponse> mockList = List.of(
                new WorkScheduleResponse("1", "U1", WorkDay.MON, WorkPeriod.AM, "08:00", "12:00"),
                new WorkScheduleResponse("2", "U1", WorkDay.FRI, WorkPeriod.PM, "13:00", "17:00")
        );
        when(workScheduleService.listForUser("123")).thenReturn(mockList);

        List<WorkScheduleResponse> result = controller.workSchedulesByUser("123");

        assertEquals(2, result.size());
        verify(workScheduleService).listForUser("123");
    }

    @Test
    void testMyWorkSchedules_ReturnsList() {
        mockAuthenticatedUser("john@example.com", "1");

        List<WorkScheduleResponse> mockList = List.of(
                new WorkScheduleResponse("1", "1", WorkDay.MON, WorkPeriod.AM, "08:00", "12:00")
        );

        when(userRepository.findByEmail("john@example.com"))
                .thenReturn(Optional.of(makeUser("1", "john@example.com")));
        when(workScheduleService.listForUser("1")).thenReturn(mockList);

        List<WorkScheduleResponse> result = controller.myWorkSchedules();

        assertEquals(1, result.size());
        verify(workScheduleService).listForUser("1");
    }

    /* ======================= MUTATIONS ======================= */

    @Test
    void testUpsertMyWorkSchedule_Success() {
        mockAuthenticatedUser("john@example.com", "1");
        WorkScheduleRequest req =
                new WorkScheduleRequest(WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");
        WorkScheduleResponse expected =
                new WorkScheduleResponse("1", "1", WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");

        when(userRepository.findByEmail("john@example.com"))
                .thenReturn(Optional.of(makeUser("1", "john@example.com")));
        when(workScheduleService.upsertForUser("1", req)).thenReturn(expected);

        WorkScheduleResponse result = controller.upsertMyWorkSchedule(req);

        verify(access).assertCanSelfManage("1");
        assertEquals(expected, result);
    }

    @Test
    void testDeleteMyWorkScheduleSlot_Success() {
        mockAuthenticatedUser("john@example.com", "1");
        when(userRepository.findByEmail("john@example.com"))
                .thenReturn(Optional.of(makeUser("1", "john@example.com")));

        Boolean result = controller.deleteMyWorkScheduleSlot(WorkDay.MON, WorkPeriod.AM);

        assertTrue(result);
        verify(access).assertCanSelfManage("1");
        verify(workScheduleService).deleteSlot("1", WorkDay.MON, WorkPeriod.AM);
    }

    @Test
    void testUpsertWorkSchedule_Success() {
        mockAuthenticatedUser("admin@example.com", "A1");
        WorkScheduleRequest req =
                new WorkScheduleRequest(WorkDay.FRI, WorkPeriod.PM, "14:00", "18:00");
        WorkScheduleResponse expected =
                new WorkScheduleResponse("5", "U2", WorkDay.FRI, WorkPeriod.PM, "14:00", "18:00");

        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(makeUser("A1", "admin@example.com")));
        when(workScheduleService.upsertForUser("U2", req)).thenReturn(expected);

        WorkScheduleResponse result = controller.upsertWorkSchedule("U2", req);

        verify(access).assertCanManage("A1", "U2");
        assertEquals(expected, result);
    }

    @Test
    void testUpsertWorkScheduleBatch_Success() {
        mockAuthenticatedUser("admin@example.com", "A1");

        WorkScheduleRequest req1 =
                new WorkScheduleRequest(WorkDay.THU, WorkPeriod.PM, "13:00", "17:00");
        List<WorkScheduleRequest> entries = List.of(req1);
        WorkScheduleBatchRequest batch = new WorkScheduleBatchRequest(entries, false);

        List<WorkScheduleResponse> mockList = List.of(
                new WorkScheduleResponse("6", "U2", WorkDay.THU, WorkPeriod.PM, "13:00", "17:00")
        );

        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(makeUser("A1", "admin@example.com")));
        when(workScheduleService.batchUpsertForUser("U2", batch)).thenReturn(mockList);

        List<WorkScheduleResponse> result = controller.upsertWorkScheduleBatch("U2", batch);

        verify(access).assertCanManage("A1", "U2");
        assertEquals(1, result.size());
    }

    @Test
    void testDeleteWorkScheduleSlot_Success() {
        mockAuthenticatedUser("admin@example.com", "A1");
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(makeUser("A1", "admin@example.com")));

        Boolean result = controller.deleteWorkScheduleSlot("U2", WorkDay.FRI, WorkPeriod.PM);

        assertTrue(result);
        verify(access).assertCanManage("A1", "U2");
        verify(workScheduleService).deleteSlot("U2", WorkDay.FRI, WorkPeriod.PM);
    }

    /* ======================= HELPERS ======================= */

    @Test
    void testCurrentUserId_ThrowsIfNoAuth() {
        SecurityContextHolder.clearContext();
        assertThrows(EntityNotFoundException.class, this::invokeCurrentUserId);
    }

    @Test
    void testCurrentUserId_ThrowsIfUserNotFound() {
        mockAuthenticatedUser("ghost@example.com", null);
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        EntityNotFoundException ex =
                assertThrows(EntityNotFoundException.class, this::invokeCurrentUserId);
        assertTrue(ex.getMessage().contains("User not found by email"));
    }

    /* ======================= UTILS ======================= */

    private User makeUser(String id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        return u;
    }

    private void mockAuthenticatedUser(String email, String id) {
        var auth = new TestingAuthenticationToken(email, "password");
        SecurityContextHolder.getContext().setAuthentication(auth);
        if (id != null) {
            when(userRepository.findByEmail(email))
                    .thenReturn(Optional.of(makeUser(id, email)));
        }
    }

    private String invokeCurrentUserId() {
        try {
            var method = WorkScheduleController.class.getDeclaredMethod("currentUserId");
            method.setAccessible(true);
            return (String) method.invoke(controller);
        } catch (Exception e) {
            if (e.getCause() instanceof EntityNotFoundException ex) throw ex;
            throw new RuntimeException(e);
        }
    }
}
