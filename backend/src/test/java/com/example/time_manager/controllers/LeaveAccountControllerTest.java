package com.example.time_manager.controllers;

import com.example.time_manager.dto.leave.LeaveAccountCreateInput;
import com.example.time_manager.dto.leave.LeaveAccountUpdateInput;
import com.example.time_manager.graphql.controller.LeaveAccountController;
import com.example.time_manager.model.leave.LeaveAccount;
import com.example.time_manager.service.leave.LeaveAccountService;
import org.junit.jupiter.api.*;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LeaveAccountControllerTest {

    @Mock
    private LeaveAccountService service;

    private LeaveAccountController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        controller = new LeaveAccountController(service);
    }

    @Test
    void testLeaveAccount_ReturnsAccount() {
        LeaveAccount mock = new LeaveAccount();
        when(service.get(5L)).thenReturn(mock);

        LeaveAccount result = controller.leaveAccount(5L);

        assertEquals(mock, result);
        verify(service).get(5L);
    }

    @Test
    void testLeaveAccountsByUser_ReturnsList() {
        List<LeaveAccount> accounts = List.of(new LeaveAccount(), new LeaveAccount());
        when(service.listByUser("user123")).thenReturn(accounts);

        List<LeaveAccount> result = controller.leaveAccountsByUser("user123");

        assertEquals(2, result.size());
        verify(service).listByUser("user123");
    }

    @Test
    void testCurrentBalance_ComputesCorrectValue() {
        LeaveAccount acc = new LeaveAccount();
        acc.setId(10L);
        when(service.computeCurrentBalance(10L)).thenReturn(BigDecimal.valueOf(25.5));

        Double result = controller.currentBalance(acc);

        assertEquals(25.5, result);
        verify(service).computeCurrentBalance(10L);
    }

    @Test
    void testCreateLeaveAccount_Success() {
        LeaveAccountCreateInput input = new LeaveAccountCreateInput();
        input.setUserId("U1");
        input.setLeaveTypeCode("VAC");
        input.setOpeningBalance(10.0f);
        input.setAccrualPerMonth(1.5f);
        input.setMaxCarryover(30.0f);
        input.setCarryoverExpireOn("2024-12-31");

        LeaveAccount expected = new LeaveAccount();
        when(service.create(
                eq("U1"),
                eq("VAC"),
                eq(BigDecimal.valueOf(10.0)),
                eq(BigDecimal.valueOf(1.5)),
                eq(BigDecimal.valueOf(30.0)),
                eq(LocalDate.parse("2024-12-31"))
        )).thenReturn(expected);

        LeaveAccount result = controller.createLeaveAccount(input);

        assertEquals(expected, result);
        verify(service).create(
                "U1", "VAC",
                BigDecimal.valueOf(10.0),
                BigDecimal.valueOf(1.5),
                BigDecimal.valueOf(30.0),
                LocalDate.parse("2024-12-31")
        );
    }

    @Test
    void testCreateLeaveAccount_NullFieldsHandled() {
        LeaveAccountCreateInput input = new LeaveAccountCreateInput();
        input.setUserId("U2");
        input.setLeaveTypeCode("SICK");
        input.setOpeningBalance(null);
        input.setAccrualPerMonth(null);
        input.setMaxCarryover(null);
        input.setCarryoverExpireOn(null);

        LeaveAccount expected = new LeaveAccount();
        when(service.create("U2", "SICK", null, null, null, null)).thenReturn(expected);

        LeaveAccount result = controller.createLeaveAccount(input);

        assertEquals(expected, result);
        verify(service).create("U2", "SICK", null, null, null, null);
    }

    @Test
    void testUpdateLeaveAccount_Success() {
        LeaveAccountUpdateInput input = new LeaveAccountUpdateInput();
        input.setId(42L);
        input.setOpeningBalance(5.0f);
        input.setAccrualPerMonth(2.0f);
        input.setMaxCarryover(15.0f);
        input.setCarryoverExpireOn("2025-06-01");

        LeaveAccount expected = new LeaveAccount();
        when(service.update(
                42L,
                BigDecimal.valueOf(5.0),
                BigDecimal.valueOf(2.0),
                BigDecimal.valueOf(15.0),
                LocalDate.parse("2025-06-01")
        )).thenReturn(expected);

        LeaveAccount result = controller.updateLeaveAccount(input);

        assertEquals(expected, result);
        verify(service).update(
                42L,
                BigDecimal.valueOf(5.0),
                BigDecimal.valueOf(2.0),
                BigDecimal.valueOf(15.0),
                LocalDate.parse("2025-06-01")
        );
    }

    @Test
    void testUpdateLeaveAccount_NullFieldsHandled() {
        LeaveAccountUpdateInput input = new LeaveAccountUpdateInput();
        input.setId(7L);
        input.setOpeningBalance(null);
        input.setAccrualPerMonth(null);
        input.setMaxCarryover(null);
        input.setCarryoverExpireOn(null);

        LeaveAccount expected = new LeaveAccount();
        when(service.update(7L, null, null, null, null)).thenReturn(expected);

        LeaveAccount result = controller.updateLeaveAccount(input);

        assertEquals(expected, result);
        verify(service).update(7L, null, null, null, null);
    }

    @Test
    void testDeleteLeaveAccount_Success() {
        when(service.delete(55L)).thenReturn(true);

        Boolean result = controller.deleteLeaveAccount(55L);

        assertTrue(result);
        verify(service).delete(55L);
    }
}
