package com.example.time_manager.services.leaves;

import com.example.time_manager.model.absence.*;
import com.example.time_manager.model.leave.*;
import com.example.time_manager.repository.AbsenceDayRepository;
import com.example.time_manager.repository.leave.LeaveAccountRepository;
import com.example.time_manager.repository.leave.LeaveLedgerRepository;
import com.example.time_manager.service.leave.LeaveAccountingBridge;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LeaveAccountingBridgeTest {

    private LeaveAccountRepository accountRepo;
    private LeaveLedgerRepository ledgerRepo;
    private AbsenceDayRepository dayRepo;
    private LeaveAccountingBridge bridge;

    @BeforeEach
    void setUp() {
        accountRepo = mock(LeaveAccountRepository.class);
        ledgerRepo = mock(LeaveLedgerRepository.class);
        dayRepo = mock(AbsenceDayRepository.class);
        bridge = new LeaveAccountingBridge(accountRepo, ledgerRepo, dayRepo);
    }

    @Test
    void testMapAbsenceToLeaveTypeCode_ReturnsCorrectCodes() throws Exception {
        var method = LeaveAccountingBridge.class.getDeclaredMethod("mapAbsenceToLeaveTypeCode", AbsenceType.class);
        method.setAccessible(true);

        assertEquals(Optional.of("RTT"), method.invoke(bridge, AbsenceType.RTT));
        assertEquals(Optional.of("VAC"), method.invoke(bridge, AbsenceType.VACATION));
        assertEquals(Optional.empty(), method.invoke(bridge, AbsenceType.SICK));
        assertEquals(Optional.empty(), method.invoke(bridge, (Object) null));
    }

    @Test
    void testComputeUnits_EmptyDays_ReturnsZero() throws Exception {
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(1L)).thenReturn(List.of());
        var method = LeaveAccountingBridge.class.getDeclaredMethod("computeUnits", Long.class);
        method.setAccessible(true);
        BigDecimal result = (BigDecimal) method.invoke(bridge, 1L);
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    void testComputeUnits_WithDifferentPeriods() throws Exception {
        AbsenceDay full = new AbsenceDay();
        full.setPeriod(AbsencePeriod.FULL_DAY);
        AbsenceDay am = new AbsenceDay();
        am.setPeriod(AbsencePeriod.AM);
        AbsenceDay pm = new AbsenceDay();
        pm.setPeriod(AbsencePeriod.PM);
        AbsenceDay nullPeriod = new AbsenceDay();
        nullPeriod.setPeriod(null);
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(2L)).thenReturn(List.of(full, am, pm, nullPeriod));

        var method = LeaveAccountingBridge.class.getDeclaredMethod("computeUnits", Long.class);
        method.setAccessible(true);
        BigDecimal result = (BigDecimal) method.invoke(bridge, 2L);

        assertEquals(BigDecimal.valueOf(3.0), result);
    }

    @Test
    void testEnsureDebit_SkipsWhenNotApproved() {
        Absence absence = new Absence();
        absence.setStatus(AbsenceStatus.PENDING);
        bridge.ensureDebitForApprovedAbsence(absence);
        verifyNoInteractions(accountRepo, ledgerRepo, dayRepo);
    }

    @Test
    void testEnsureDebit_NoMappingFound() {
        Absence absence = new Absence();
        absence.setStatus(AbsenceStatus.APPROVED);
        absence.setType(AbsenceType.SICK);
        bridge.ensureDebitForApprovedAbsence(absence);
        verifyNoInteractions(accountRepo, ledgerRepo);
    }

    @Test
    void testEnsureDebit_AccountNotFound_Throws() {
        Absence absence = new Absence();
        absence.setId(1L);
        absence.setStatus(AbsenceStatus.APPROVED);
        absence.setType(AbsenceType.RTT);
        absence.setUserId("user123");
        absence.setStartDate(LocalDate.of(2025, 1, 1));

        when(accountRepo.findByUser_IdAndLeaveType_Code("user123", "RTT"))
                .thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () ->
                bridge.ensureDebitForApprovedAbsence(absence));
    }

    @Test
    void testEnsureDebit_CreatesNewLedger_WhenNoneExists() {
        Absence absence = new Absence();
        absence.setId(2L);
        absence.setStatus(AbsenceStatus.APPROVED);
        absence.setType(AbsenceType.VACATION);
        absence.setUserId("u1");
        absence.setStartDate(LocalDate.of(2025, 1, 5));

        LeaveAccount acc = new LeaveAccount();
        when(accountRepo.findByUser_IdAndLeaveType_Code("u1", "VAC")).thenReturn(Optional.of(acc));
        when(ledgerRepo.findFirstByReferenceAbsence_Id(2L)).thenReturn(Optional.empty());
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(2L)).thenReturn(List.of());

        LeaveLedger savedLedger = new LeaveLedger();
        when(ledgerRepo.save(any())).thenReturn(savedLedger);

        bridge.ensureDebitForApprovedAbsence(absence);

        verify(ledgerRepo).save(any(LeaveLedger.class));
    }

    @Test
    void testEnsureDebit_UpdatesExistingLedger() {
        Absence absence = new Absence();
        absence.setId(3L);
        absence.setStatus(AbsenceStatus.APPROVED);
        absence.setType(AbsenceType.RTT);
        absence.setUserId("U2");
        absence.setStartDate(LocalDate.of(2025, 2, 10));

        LeaveAccount acc = new LeaveAccount();
        LeaveLedger existing = new LeaveLedger();

        when(accountRepo.findByUser_IdAndLeaveType_Code("U2", "RTT")).thenReturn(Optional.of(acc));
        when(ledgerRepo.findFirstByReferenceAbsence_Id(3L)).thenReturn(Optional.of(existing));
        when(dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(3L)).thenReturn(List.of());

        bridge.ensureDebitForApprovedAbsence(absence);

        verify(ledgerRepo).save(existing);
        assertEquals(acc, existing.getAccount());
        assertEquals(LeaveLedgerKind.DEBIT, existing.getKind());
        assertEquals(BigDecimal.ZERO, existing.getAmount());
        assertEquals(absence, existing.getReferenceAbsence());
        assertTrue(existing.getNote().contains("Auto debit for absence #3"));
    }

    @Test
    void testRemoveDebitForAbsence_CallsRepoDelete() {
        bridge.removeDebitForAbsence(99L);
        verify(ledgerRepo).deleteByReferenceAbsence_Id(99L);
    }
}
