package com.example.time_manager.model.leave;

import com.example.time_manager.model.absence.Absence;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class LeaveLedgerTest {

    @Test
    void testGettersAndSetters() {
        LeaveLedger ledger = new LeaveLedger();

        Long id = 10L;
        LeaveAccount account = new LeaveAccount();
        LocalDate date = LocalDate.of(2025, 1, 1);
        LeaveLedgerKind kind = LeaveLedgerKind.ACCRUAL;
        BigDecimal amount = new BigDecimal("5.50");
        Absence absence = new Absence();
        String note = "Congé payé de janvier";
        Instant createdAt = Instant.now();

        ledger.setId(id);
        ledger.setAccount(account);
        ledger.setEntryDate(date);
        ledger.setKind(kind);
        ledger.setAmount(amount);
        ledger.setReferenceAbsence(absence);
        ledger.setNote(note);
        ledger.setCreatedAt(createdAt);

        assertEquals(id, ledger.getId());
        assertEquals(account, ledger.getAccount());
        assertEquals(date, ledger.getEntryDate());
        assertEquals(kind, ledger.getKind());
        assertEquals(amount, ledger.getAmount());
        assertEquals(absence, ledger.getReferenceAbsence());
        assertEquals(note, ledger.getNote());
        assertEquals(createdAt, ledger.getCreatedAt());
    }

    @Test
    void testDefaultConstructorAndNullFields() {
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
    void testAmountPrecisionAndScale() {
        LeaveLedger ledger = new LeaveLedger();
        BigDecimal amount = new BigDecimal("123.45");
        ledger.setAmount(amount);
        assertEquals(new BigDecimal("123.45"), ledger.getAmount());
    }

    @Test
    void testSetNoteAllowsNull() {
        LeaveLedger ledger = new LeaveLedger();
        ledger.setNote(null);
        assertNull(ledger.getNote());
    }
}
