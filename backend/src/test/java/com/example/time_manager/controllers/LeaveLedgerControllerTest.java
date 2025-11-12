package com.example.time_manager.controllers;

import com.example.time_manager.dto.leave.LeaveLedgerCreateInput;
import com.example.time_manager.dto.leave.LeaveLedgerUpdateInput;
import com.example.time_manager.graphql.controller.LeaveLedgerController;
import com.example.time_manager.model.leave.LeaveLedger;
import com.example.time_manager.model.leave.LeaveLedgerKind;
import com.example.time_manager.service.leave.LeaveLedgerService;
import org.junit.jupiter.api.*;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LeaveLedgerControllerTest {

    @Mock
    private LeaveLedgerService service;

    private LeaveLedgerController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        controller = new LeaveLedgerController(service);
    }

    @Test
    void testLeaveLedgerByAccount_WithDateRange() {
        List<LeaveLedger> mockList = List.of(new LeaveLedger(), new LeaveLedger());
        LocalDate from = LocalDate.of(2024, 1, 1);
        LocalDate to = LocalDate.of(2024, 12, 31);

        when(service.listByAccountBetween(10L, from, to)).thenReturn(mockList);

        List<LeaveLedger> result =
                controller.leaveLedgerByAccount(10L, "2024-01-01", "2024-12-31");

        assertEquals(2, result.size());
        verify(service).listByAccountBetween(10L, from, to);
    }

    @Test
    void testLeaveLedgerByAccount_WithoutDateRange() {
        List<LeaveLedger> mockList = List.of(new LeaveLedger());
        when(service.listByAccount(5L)).thenReturn(mockList);

        List<LeaveLedger> result = controller.leaveLedgerByAccount(5L, null, null);

        assertEquals(1, result.size());
        verify(service).listByAccount(5L);
    }

    @Test
    void testAddLeaveLedgerEntry_Success() {
        LeaveLedgerCreateInput input = new LeaveLedgerCreateInput();
        input.setAccountId(12L);
        input.setEntryDate("2024-05-01");
        input.setKind("ACCRUAL");
        input.setAmount(3.5f);
        input.setReferenceAbsenceId(77L);
        input.setNote("Bonus leave");

        LeaveLedger expected = new LeaveLedger();
        when(service.addEntry(
                eq(12L),
                eq(LocalDate.parse("2024-05-01")),
                eq(LeaveLedgerKind.ACCRUAL),
                eq(BigDecimal.valueOf(3.5)),
                eq(77L),
                eq("Bonus leave")
        )).thenReturn(expected);

        LeaveLedger result = controller.addLeaveLedgerEntry(input);

        assertEquals(expected, result);
        verify(service).addEntry(
                12L,
                LocalDate.parse("2024-05-01"),
                LeaveLedgerKind.ACCRUAL, // ✅ cohérent
                BigDecimal.valueOf(3.5),
                77L,
                "Bonus leave"
        );
    }

    @Test
    void testAddLeaveLedgerEntry_NullFieldsHandled() {
        LeaveLedgerCreateInput input = new LeaveLedgerCreateInput();
        input.setAccountId(5L);
        input.setEntryDate(null);
        input.setKind("DEBIT");
        input.setAmount(null);
        input.setReferenceAbsenceId(null);
        input.setNote("Auto adjustment");

        LeaveLedger expected = new LeaveLedger();
        when(service.addEntry(
                5L, null, LeaveLedgerKind.DEBIT, null, null, "Auto adjustment"
        )).thenReturn(expected);

        LeaveLedger result = controller.addLeaveLedgerEntry(input);

        assertEquals(expected, result);
        verify(service).addEntry(5L, null, LeaveLedgerKind.DEBIT, null, null, "Auto adjustment");
    }

    @Test
    void testUpdateLeaveLedgerEntry_Success() {
        LeaveLedgerUpdateInput input = new LeaveLedgerUpdateInput();
        input.setId(42L);
        input.setEntryDate("2025-01-15");
        input.setAmount(7f);
        input.setNote("Manual fix");

        LeaveLedger expected = new LeaveLedger();
        when(service.update(
                42L,
                LocalDate.parse("2025-01-15"),
                BigDecimal.valueOf(7.0),
                "Manual fix"
        )).thenReturn(expected);

        LeaveLedger result = controller.updateLeaveLedgerEntry(input);

        assertEquals(expected, result);
        verify(service).update(
                42L,
                LocalDate.parse("2025-01-15"),
                BigDecimal.valueOf(7.0),
                "Manual fix"
        );
    }

    @Test
    void testUpdateLeaveLedgerEntry_NullFieldsHandled() {
        LeaveLedgerUpdateInput input = new LeaveLedgerUpdateInput();
        input.setId(33L);
        input.setEntryDate(null);
        input.setAmount(null);
        input.setNote("No date or amount");

        LeaveLedger expected = new LeaveLedger();
        when(service.update(33L, null, null, "No date or amount")).thenReturn(expected);

        LeaveLedger result = controller.updateLeaveLedgerEntry(input);

        assertEquals(expected, result);
        verify(service).update(33L, null, null, "No date or amount");
    }

    @Test
    void testDeleteLeaveLedgerEntry_Success() {
        when(service.delete(55L)).thenReturn(true);

        Boolean result = controller.deleteLeaveLedgerEntry(55L);

        assertTrue(result);
        verify(service).delete(55L);
    }

    @Test
    void testAddLeaveLedgerEntry_InvalidKind_ThrowsException() {
        LeaveLedgerCreateInput input = new LeaveLedgerCreateInput();
        input.setAccountId(1L);
        input.setKind("INVALID_KIND");

        assertThrows(IllegalArgumentException.class, () -> controller.addLeaveLedgerEntry(input));
    }

    @Test
    void testUpdateLeaveLedgerEntry_ServiceThrows_Propagates() {
        LeaveLedgerUpdateInput input = new LeaveLedgerUpdateInput();
        input.setId(99L);
        input.setEntryDate("2024-02-01");
        input.setAmount(5.0f);
        input.setNote("Error case");

        when(service.update(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Update failed"));

        RuntimeException ex =
                assertThrows(RuntimeException.class, () -> controller.updateLeaveLedgerEntry(input));

        assertEquals("Update failed", ex.getMessage());
        verify(service).update(eq(99L), any(), any(), eq("Error case"));
    }
}
