package com.example.time_manager.repository.leave;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.time_manager.model.leave.LeaveLedger;

public interface LeaveLedgerRepository extends JpaRepository<LeaveLedger, Long> {
  List<LeaveLedger> findByAccount_IdOrderByEntryDateAsc(Long accountId);
  List<LeaveLedger> findByAccount_IdAndEntryDateBetweenOrderByEntryDateAsc(Long accountId, LocalDate from, LocalDate to);

  List<LeaveLedger> findByReferenceAbsence_Id(Long absenceId);
  Optional<LeaveLedger> findFirstByReferenceAbsence_Id(Long absenceId);
  void deleteByReferenceAbsence_Id(Long absenceId);

  @Query("""
    select coalesce(sum(
      case ll.kind
        when com.example.time_manager.model.leave.LeaveLedgerKind.ACCRUAL then ll.amount
        when com.example.time_manager.model.leave.LeaveLedgerKind.ADJUSTMENT then ll.amount
        else -ll.amount
      end
    ), 0)
    from LeaveLedger ll
    where ll.account.id = :accountId
  """)
  Optional<BigDecimal> sumSignedAmountByAccountId(Long accountId);
}
