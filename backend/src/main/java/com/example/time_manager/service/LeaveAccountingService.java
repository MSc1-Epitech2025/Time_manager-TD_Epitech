package com.example.time_manager.service;

import com.example.time_manager.model.absence.Absence;
import com.example.time_manager.model.absence.AbsenceType;
import com.example.time_manager.model.leave.LeaveKind;
import com.example.time_manager.model.leave.LeaveLedger;
import com.example.time_manager.model.leave.LeaveType;
import com.example.time_manager.repository.AbsenceDayRepository;
import com.example.time_manager.repository.LeaveAccountRepository;
import com.example.time_manager.repository.LeaveLedgerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@Transactional
public class LeaveAccountingService {

  private final LeaveAccountRepository accountRepo;
  private final LeaveLedgerRepository ledgerRepo;
  private final AbsenceDayRepository dayRepo;

  public LeaveAccountingService(LeaveAccountRepository a, LeaveLedgerRepository l, AbsenceDayRepository d) {
    this.accountRepo = a; this.ledgerRepo = l; this.dayRepo = d;
  }

  public void debitOnApproval(Absence absence) {
    var leaveType = mapAbsenceTypeToLeaveType(absence.getType());
    if (leaveType == null) return; 

    var acc = accountRepo.findByUserIdAndLeaveType(absence.getUser().getId(), leaveType)
        .orElseThrow(() -> new IllegalStateException("No leave account for user/type"));

    double qty = computeQuantity(absence);
    if (qty <= 0) return;

    var mv = new LeaveLedger();
    mv.setAccount(acc); 
    mv.setEntryDate(LocalDate.now());
    mv.setKind(LeaveKind.DEBIT);
    mv.setAmount(BigDecimal.valueOf(-qty));
    mv.setReferenceAbsence(absence);       
    mv.setNote("Absence approved");
    ledgerRepo.save(mv);
  }

  public void reverseForAbsence(Long absenceId, String note) {
    var lines = ledgerRepo.findByReferenceAbsenceId(absenceId);
    for (var l : lines) {
      var reverse = new LeaveLedger();
      reverse.setAccount(l.getAccount());
      reverse.setEntryDate(LocalDate.now());
      reverse.setKind(LeaveKind.ADJUSTMENT);
      reverse.setAmount(l.getAmount().negate()); 
      reverse.setReferenceAbsence(l.getReferenceAbsence());
      reverse.setNote("Reverse: " + note);
      ledgerRepo.save(reverse);
    }
  }

  private LeaveType mapAbsenceTypeToLeaveType(AbsenceType t) {
    return switch (t) {
      case VACATION -> LeaveType.VACATION;
      case RTT      -> LeaveType.RTT;
      case PERSONAL -> LeaveType.PERSONAL;
      case SICK     -> LeaveType.SICK;     
      case FORMATION, OTHER -> null;       
    };
  }

  private double computeQuantity(Absence a) {
    var days = dayRepo.findByAbsence_IdOrderByAbsenceDateAsc(a.getId());
    double sum = 0.0;
    for (var d : days) {
      if (isWeekend(d.getAbsenceDate()) || isHoliday(d.getAbsenceDate())) continue;
      sum += switch (d.getPeriod()) {
        case FULL_DAY -> 1.0;
        case AM, PM   -> 0.5;
      };
    }
    return sum;
  }

  private boolean isWeekend(LocalDate d) {
    var w = d.getDayOfWeek();
    return w == java.time.DayOfWeek.SATURDAY || w == java.time.DayOfWeek.SUNDAY;
  }

  private boolean isHoliday(LocalDate d) {
    return false;
  }
}
