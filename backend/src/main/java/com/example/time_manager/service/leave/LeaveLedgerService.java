// src/main/java/com/example/time_manager/service/leave/LeaveLedgerService.java
package com.example.time_manager.service.leave;

import com.example.time_manager.model.absence.Absence;
import com.example.time_manager.model.leave.LeaveAccount;
import com.example.time_manager.model.leave.LeaveLedger;
import com.example.time_manager.model.leave.LeaveLedgerKind;
import com.example.time_manager.repository.AbsenceRepository;
import com.example.time_manager.repository.leave.LeaveAccountRepository;
import com.example.time_manager.repository.leave.LeaveLedgerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class LeaveLedgerService {
  private final LeaveLedgerRepository repo;
  private final LeaveAccountRepository accountRepo;
  private final AbsenceRepository absenceRepo;

  public LeaveLedgerService(LeaveLedgerRepository repo,
                            LeaveAccountRepository accountRepo,
                            AbsenceRepository absenceRepo) {
    this.repo = repo;
    this.accountRepo = accountRepo;
    this.absenceRepo = absenceRepo;
  }

  public LeaveLedger addEntry(Long accountId, LocalDate date, LeaveLedgerKind kind,
                              BigDecimal amount, Long refAbsenceId, String note) {
    if (amount == null) throw new IllegalArgumentException("amount is required");
    if (amount.compareTo(BigDecimal.ZERO) < 0)
      throw new IllegalArgumentException("amount must be >= 0 (sign handled by kind)");

    LeaveAccount acc = accountRepo.findById(accountId)
      .orElseThrow(() -> new IllegalArgumentException("LeaveAccount not found: " + accountId));

    LeaveLedger ll = new LeaveLedger();
    ll.setAccount(acc);
    ll.setEntryDate(date != null ? date : LocalDate.now());
    ll.setKind(kind);
    ll.setAmount(amount);
    if (refAbsenceId != null) {
      Absence abs = absenceRepo.findById(refAbsenceId)
        .orElseThrow(() -> new IllegalArgumentException("Absence not found: " + refAbsenceId));
      ll.setReferenceAbsence(abs);
    }
    ll.setNote(note);
    return repo.save(ll);
  }

  public LeaveLedger update(Long id, LocalDate date, BigDecimal amount, String note) {
    LeaveLedger ll = repo.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("LeaveLedger not found: " + id));
    if (date != null) ll.setEntryDate(date);
    if (amount != null) {
      if (amount.compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("amount must be >= 0");
      ll.setAmount(amount);
    }
    if (note != null) ll.setNote(note);
    return repo.save(ll);
  }

  public boolean delete(Long id) {
    if (!repo.existsById(id)) return false;
    repo.deleteById(id);
    return true;
  }

  public List<LeaveLedger> listByAccount(Long accountId) {
    return repo.findByAccount_IdOrderByEntryDateAsc(accountId);
  }

  public List<LeaveLedger> listByAccountBetween(Long accountId, LocalDate from, LocalDate to) {
    return repo.findByAccount_IdAndEntryDateBetweenOrderByEntryDateAsc(accountId, from, to);
  }
}
