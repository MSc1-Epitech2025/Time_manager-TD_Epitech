package com.example.time_manager.service.leave;

import com.example.time_manager.model.absence.Absence;
import com.example.time_manager.model.leave.LeaveAccount;
import com.example.time_manager.model.leave.LeaveLedger;
import com.example.time_manager.model.leave.LeaveLedgerKind;
import com.example.time_manager.repository.AbsenceRepository;
import com.example.time_manager.repository.leave.LeaveAccountRepository;
import com.example.time_manager.repository.leave.LeaveLedgerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LeaveLedgerServiceTest {

    private LeaveLedgerRepository repo;
    private LeaveAccountRepository accountRepo;
    private AbsenceRepository absenceRepo;
    private LeaveLedgerService service;

    private final Long accountId = 1L;
    private final Long ledgerId = 10L;
    private final Long absenceId = 99L;

    @BeforeEach
    void setUp() {
        repo = mock(LeaveLedgerRepository.class);
        accountRepo = mock(LeaveAccountRepository.class);
        absenceRepo = mock(AbsenceRepository.class);
        service = new LeaveLedgerService(repo, accountRepo, absenceRepo);
    }

    @Test
    void testAddEntry_Success_WithAbsenceAndNote() {
        LeaveAccount acc = new LeaveAccount();
        when(accountRepo.findById(accountId)).thenReturn(Optional.of(acc));

        Absence abs = new Absence();
        when(absenceRepo.findById(absenceId)).thenReturn(Optional.of(abs));

        LeaveLedger saved = new LeaveLedger();
        when(repo.save(any())).thenReturn(saved);

        LeaveLedger result = service.addEntry(accountId, LocalDate.of(2025, 1, 1),
                LeaveLedgerKind.ACCRUAL, new BigDecimal("5"), absenceId, "note");

        assertNotNull(result);
        verify(repo).save(any());
    }

    @Test
    void testAddEntry_Success_WithoutAbsence_AndNullDate() {
        LeaveAccount acc = new LeaveAccount();
        when(accountRepo.findById(accountId)).thenReturn(Optional.of(acc));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        LeaveLedger result = service.addEntry(accountId, null,
                LeaveLedgerKind.DEBIT, new BigDecimal("3"), null, null);

        assertNotNull(result.getEntryDate());
        assertEquals(new BigDecimal("3"), result.getAmount());
        assertEquals(LeaveLedgerKind.DEBIT, result.getKind());
    }

    @Test
    void testAddEntry_MissingAmount_Throws() {
        assertThrows(IllegalArgumentException.class, () ->
                service.addEntry(accountId, LocalDate.now(), LeaveLedgerKind.ACCRUAL, null, null, null));
    }

    @Test
    void testAddEntry_NegativeAmount_Throws() {
        assertThrows(IllegalArgumentException.class, () ->
                service.addEntry(accountId, LocalDate.now(), LeaveLedgerKind.ACCRUAL, new BigDecimal("-5"), null, null));
    }

    @Test
    void testAddEntry_AccountNotFound_Throws() {
        when(accountRepo.findById(accountId)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () ->
                service.addEntry(accountId, LocalDate.now(), LeaveLedgerKind.ACCRUAL, BigDecimal.ONE, null, null));
    }

    @Test
    void testAddEntry_AbsenceNotFound_Throws() {
        LeaveAccount acc = new LeaveAccount();
        when(accountRepo.findById(accountId)).thenReturn(Optional.of(acc));
        when(absenceRepo.findById(absenceId)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () ->
                service.addEntry(accountId, LocalDate.now(), LeaveLedgerKind.ADJUSTMENT, BigDecimal.ONE, absenceId, null));
    }

    @Test
    void testUpdate_Success_AllFields() {
        LeaveLedger existing = new LeaveLedger();
        existing.setId(ledgerId);
        when(repo.findById(ledgerId)).thenReturn(Optional.of(existing));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        LeaveLedger result = service.update(ledgerId, LocalDate.of(2025, 2, 2), new BigDecimal("10"), "updated");
        assertEquals(new BigDecimal("10"), result.getAmount());
        assertEquals("updated", result.getNote());
        assertEquals(LocalDate.of(2025, 2, 2), result.getEntryDate());
    }

    @Test
    void testUpdate_NotFound_Throws() {
        when(repo.findById(ledgerId)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () ->
                service.update(ledgerId, LocalDate.now(), BigDecimal.ONE, "note"));
    }

    @Test
    void testUpdate_NegativeAmount_Throws() {
        LeaveLedger ll = new LeaveLedger();
        when(repo.findById(ledgerId)).thenReturn(Optional.of(ll));
        assertThrows(IllegalArgumentException.class, () ->
                service.update(ledgerId, LocalDate.now(), new BigDecimal("-1"), "bad"));
    }

    @Test
    void testUpdate_PartialValues_NullIgnored() {
        LeaveLedger ll = new LeaveLedger();
        ll.setAmount(new BigDecimal("2"));
        ll.setNote("old");
        when(repo.findById(ledgerId)).thenReturn(Optional.of(ll));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        LeaveLedger result = service.update(ledgerId, null, null, null);

        assertEquals(new BigDecimal("2"), result.getAmount());
        assertEquals("old", result.getNote());
    }

    @Test
    void testDelete_Existing() {
        when(repo.existsById(ledgerId)).thenReturn(true);
        boolean result = service.delete(ledgerId);
        assertTrue(result);
        verify(repo).deleteById(ledgerId);
    }

    @Test
    void testDelete_NotExisting() {
        when(repo.existsById(ledgerId)).thenReturn(false);
        boolean result = service.delete(ledgerId);
        assertFalse(result);
        verify(repo, never()).deleteById(any());
    }

    @Test
    void testListByAccount() {
        List<LeaveLedger> list = List.of(new LeaveLedger());
        when(repo.findByAccount_IdOrderByEntryDateAsc(accountId)).thenReturn(list);

        List<LeaveLedger> result = service.listByAccount(accountId);
        assertEquals(1, result.size());
    }

    @Test
    void testListByAccountBetween() {
        List<LeaveLedger> list = List.of(new LeaveLedger());
        LocalDate from = LocalDate.of(2025, 1, 1);
        LocalDate to = LocalDate.of(2025, 12, 31);
        when(repo.findByAccount_IdAndEntryDateBetweenOrderByEntryDateAsc(accountId, from, to))
                .thenReturn(list);

        List<LeaveLedger> result = service.listByAccountBetween(accountId, from, to);
        assertEquals(1, result.size());
    }
}
