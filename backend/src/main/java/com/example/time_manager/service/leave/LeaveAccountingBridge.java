package com.example.time_manager.service.leave;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.time_manager.model.absence.Absence;
import com.example.time_manager.model.absence.AbsenceDay;
import com.example.time_manager.model.absence.AbsencePeriod;
import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.model.absence.AbsenceType;
import com.example.time_manager.model.leave.LeaveAccount;
import com.example.time_manager.model.leave.LeaveLedger;
import com.example.time_manager.model.leave.LeaveLedgerKind;
import com.example.time_manager.repository.AbsenceDayRepository;
import com.example.time_manager.repository.leave.LeaveAccountRepository;
import com.example.time_manager.repository.leave.LeaveLedgerRepository;

@Service
@Transactional
public class LeaveAccountingBridge {

  private final LeaveAccountRepository accountRepo;
  private final LeaveLedgerRepository ledgerRepo;
  private final AbsenceDayRepository dayRepo;

  private static final Map<AbsenceType, String> TYPE_TO_LEAVE = new EnumMap<>(AbsenceType.class);
  static {
    TYPE_TO_LEAVE.put(AbsenceType.RTT, "RTT");
    TYPE_TO_LEAVE.put(AbsenceType.VACATION, "VAC");
  }

  public LeaveAccountingBridge(LeaveAccountRepository accountRepo,
                               LeaveLedgerRepository ledgerRepo,
                               AbsenceDayRepository dayRepo) {
    this.accountRepo = accountRepo;
    this.ledgerRepo = ledgerRepo;
    this.dayRepo = dayRepo;
  }

  public void ensureDebitForApprovedAbsence(Absence absence) {
    if (absence.getStatus() != AbsenceStatus.APPROVED) return;

    Optional<String> leaveCodeOpt = mapAbsenceToLeaveTypeCode(absence.getType());
    if (leaveCodeOpt.isEmpty()) return; 

    String leaveCode = leaveCodeOpt.get();
    String userId = absence.getUserId();

    LeaveAccount account = accountRepo.findByUser_IdAndLeaveType_Code(userId, leaveCode)
        .orElseThrow(() -> new IllegalStateException(
            "No LeaveAccount for user=" + userId + " / leaveType=" + leaveCode));

    BigDecimal units = computeUnits(absence.getId()); 
    LocalDate entryDate = absence.getStartDate();
    LeaveLedger ledger = ledgerRepo.findFirstByReferenceAbsence_Id(absence.getId())
        .orElseGet(LeaveLedger::new);

    ledger.setAccount(account);
    ledger.setEntryDate(entryDate != null ? entryDate : LocalDate.now());
    ledger.setKind(LeaveLedgerKind.DEBIT);
    ledger.setAmount(units);
    ledger.setReferenceAbsence(absence);
    ledger.setNote("Auto debit for absence #" + absence.getId() + " (" + absence.getType() + ")");

    ledgerRepo.save(ledger);
  }

  public void removeDebitForAbsence(Long absenceId) {
    ledgerRepo.deleteByReferenceAbsence_Id(absenceId);
  }

  private BigDecimal computeUnits(Long absenceId) {
    List<AbsenceDay> days = dayRepo.findByAbsenceIdOrderByAbsenceDateAsc(absenceId);
    if (days.isEmpty()) return BigDecimal.ZERO;

    double total = 0.0;
    for (AbsenceDay d : days) {
      AbsencePeriod p = d.getPeriod() != null ? d.getPeriod() : AbsencePeriod.FULL_DAY;
      switch (p) {
        case AM:
        case PM:
          total += 0.5;
          break;
        case FULL_DAY:
        default:
          total += 1.0;
      }
    }
    return BigDecimal.valueOf(total);
  }

  private Optional<String> mapAbsenceToLeaveTypeCode(AbsenceType type) {
    if (type == null) return Optional.empty();
    return Optional.ofNullable(TYPE_TO_LEAVE.get(type));
  }
}
