package com.example.time_manager.repository;

import com.example.time_manager.model.leave.LeaveLedger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveLedgerRepository extends JpaRepository<LeaveLedger, Long> {
  List<LeaveLedger> findByReferenceAbsenceId(Long absenceId);
  List<LeaveLedger> findByAccount_IdOrderByEntryDateAsc(Integer accountId);
}
