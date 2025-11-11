package com.example.time_manager.model.leave;

import com.example.time_manager.model.absence.Absence;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class LeaveLedgerTest {

    @Test
    void testAllGettersAndSetters() {
        LeaveLedger ledger = new LeaveLedger();

        Long id = 42L;
        LeaveAccount account = new LeaveAccount();
        LocalDate entryDate = LocalDate.of(2025, 11, 10);
        LeaveLedgerKind kind = LeaveLedgerKind.DEBIT;
        BigDecimal amount = new BigDecimal("8.75");
        Absence absence = new Absence();
        String note = "Congé maladie";
        Instant createdAt = Instant.now();

        ledger.setId(id);
        ledger.setAccount(account);
        ledger.setEntryDate(entryDate);
        ledger.setKind(kind);
        ledger.setAmount(amount);
        ledger.setReferenceAbsence(absence);
        ledger.setNote(note);
        ledger.setCreatedAt(createdAt);

        assertEquals(id, ledger.getId());
        assertEquals(account, ledger.getAccount());
        assertEquals(entryDate, ledger.getEntryDate());
        assertEquals(kind, ledger.getKind());
        assertEquals(amount, ledger.getAmount());
        assertEquals(absence, ledger.getReferenceAbsence());
        assertEquals(note, ledger.getNote());
        assertEquals(createdAt, ledger.getCreatedAt());
    }

    @Test
    void testDefaultConstructorAndNullValues() {
        LeaveLedger ledger = new LeaveLedger();

        assertNull(ledger.getId());
        assertNull(ledger.getAccount());
        assertNull(ledger.getEntryDate());
        assertNull(ledger.getKind());
        assertNull(ledger.getAmount());
        assertNull(ledger.getReferenceAbsence());
        assertNull(ledger.getNote());
        assertNull(ledger.getCreatedAt());
    }

    @Test
    void testAmountPrecisionAndEquality() {
        LeaveLedger ledger = new LeaveLedger();
        BigDecimal amount = new BigDecimal("123.45");
        ledger.setAmount(amount);

        assertEquals(new BigDecimal("123.45"), ledger.getAmount());
        BigDecimal newAmount = new BigDecimal("0.10");
        ledger.setAmount(newAmount);
        assertEquals(new BigDecimal("0.10"), ledger.getAmount());
    }

    @Test
    void testNoteCanBeNullOrEmpty() {
        LeaveLedger ledger = new LeaveLedger();

        ledger.setNote(null);
        assertNull(ledger.getNote());

        ledger.setNote("");
        assertEquals("", ledger.getNote());

        ledger.setNote("Texte");
        assertEquals("Texte", ledger.getNote());
    }

    @Test
    void testMultipleSettersSequentially() {
        LeaveLedger ledger = new LeaveLedger();
        LeaveAccount acc1 = new LeaveAccount();
        LeaveAccount acc2 = new LeaveAccount();

        ledger.setAccount(acc1);
        assertEquals(acc1, ledger.getAccount());

        ledger.setAccount(acc2);
        assertEquals(acc2, ledger.getAccount());

        ledger.setId(1L);
        ledger.setId(2L);
        assertEquals(2L, ledger.getId());
    }

    @Test
    void testSetAndGetReferenceAbsence() {
        LeaveLedger ledger = new LeaveLedger();
        Absence absence = new Absence();
        ledger.setReferenceAbsence(absence);
        assertEquals(absence, ledger.getReferenceAbsence());

        ledger.setReferenceAbsence(null);
        assertNull(ledger.getReferenceAbsence());
    }

    @Test
    void testKindEnumAssignment() {
        LeaveLedger ledger = new LeaveLedger();
        for (LeaveLedgerKind kind : LeaveLedgerKind.values()) {
            ledger.setKind(kind);
            assertEquals(kind, ledger.getKind());
        }
    }

    @Test
    void testEntryDateChanges() {
        LeaveLedger ledger = new LeaveLedger();
        LocalDate d1 = LocalDate.of(2025, 1, 1);
        LocalDate d2 = LocalDate.of(2025, 2, 2);

        ledger.setEntryDate(d1);
        assertEquals(d1, ledger.getEntryDate());

        ledger.setEntryDate(d2);
        assertEquals(d2, ledger.getEntryDate());
    }

    @Test
    void testCreatedAtCanBeModified() {
        LeaveLedger ledger = new LeaveLedger();
        Instant now = Instant.now();
        ledger.setCreatedAt(now);
        assertEquals(now, ledger.getCreatedAt());
    }

    @Test
    void testChainedPropertyModifications() {
        LeaveLedger ledger = new LeaveLedger();

        ledger.setId(5L);
        ledger.setAccount(new LeaveAccount());
        ledger.setKind(LeaveLedgerKind.ACCRUAL);
        ledger.setAmount(new BigDecimal("2.50"));
        ledger.setNote("Changement de test");
        ledger.setEntryDate(LocalDate.now());
        ledger.setCreatedAt(Instant.now());

        assertNotNull(ledger.getAccount());
        assertEquals(LeaveLedgerKind.ACCRUAL, ledger.getKind());
        assertEquals(new BigDecimal("2.50"), ledger.getAmount());
        assertEquals("Changement de test", ledger.getNote());
        assertNotNull(ledger.getEntryDate());
        assertNotNull(ledger.getCreatedAt());
    }

    @Test
    void testAllEnumValues() {
        assertEquals("ACCRUAL", LeaveLedgerKind.ACCRUAL.name());
        assertEquals("DEBIT", LeaveLedgerKind.DEBIT.name());
        assertEquals("ADJUSTMENT", LeaveLedgerKind.ADJUSTMENT.name());
        assertEquals("CARRYOVER_EXPIRE", LeaveLedgerKind.CARRYOVER_EXPIRE.name());

        assertNotNull(LeaveLedgerKind.valueOf("ACCRUAL"));
        assertEquals(4, LeaveLedgerKind.values().length);
    }
}
