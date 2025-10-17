// src/main/java/com/example/time_manager/service/leave/LeaveAccountService.java
package com.example.time_manager.service.leave;

import com.example.time_manager.model.User;
import com.example.time_manager.model.leave.LeaveAccount;
import com.example.time_manager.model.leave.LeaveType;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.repository.leave.LeaveAccountRepository;
import com.example.time_manager.repository.leave.LeaveLedgerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class LeaveAccountService {
  private final LeaveAccountRepository repo;
  private final UserRepository userRepo;
  private final LeaveTypeService leaveTypeService;
  private final LeaveLedgerRepository ledgerRepo;

  public LeaveAccountService(LeaveAccountRepository repo,
                             UserRepository userRepo,
                             LeaveTypeService leaveTypeService,
                             LeaveLedgerRepository ledgerRepo) {
    this.repo = repo;
    this.userRepo = userRepo;
    this.leaveTypeService = leaveTypeService;
    this.ledgerRepo = ledgerRepo;
  }

  public LeaveAccount create(String userId, String leaveTypeCode, BigDecimal opening, BigDecimal accrual,
                             BigDecimal maxCarry, LocalDate expireOn) {
    if (repo.existsByUser_IdAndLeaveType_Code(userId, leaveTypeCode)) {
      throw new IllegalStateException("LeaveAccount already exists for user=" + userId + " & type=" + leaveTypeCode);
    }
    User user = userRepo.findById(userId)
      .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    LeaveType lt = leaveTypeService.getByCode(leaveTypeCode);

    LeaveAccount acc = new LeaveAccount();
    acc.setUser(user);
    acc.setLeaveType(lt);
    acc.setOpeningBalance(opening != null ? opening : BigDecimal.ZERO);
    acc.setAccrualPerMonth(accrual != null ? accrual : BigDecimal.ZERO);
    acc.setMaxCarryover(maxCarry);
    acc.setCarryoverExpireOn(expireOn);
    return repo.save(acc);
  }

  public LeaveAccount update(Long id, BigDecimal opening, BigDecimal accrual,
                             BigDecimal maxCarry, LocalDate expireOn) {
    LeaveAccount acc = repo.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("LeaveAccount not found: " + id));
    if (opening != null) acc.setOpeningBalance(opening);
    if (accrual != null) acc.setAccrualPerMonth(accrual);
    if (maxCarry != null) acc.setMaxCarryover(maxCarry);
    acc.setCarryoverExpireOn(expireOn);
    return repo.save(acc);
  }

  public boolean delete(Long id) {
    if (!repo.existsById(id)) return false;
    repo.deleteById(id);
    return true;
  }

  public LeaveAccount get(Long id) {
    return repo.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("LeaveAccount not found: " + id));
  }

  public List<LeaveAccount> listByUser(String userId) {
    return repo.findByUser_Id(userId);
  }

  /** opening_balance + sum(ledger signed amounts) */
  public BigDecimal computeCurrentBalance(Long accountId) {
    LeaveAccount acc = get(accountId);
    BigDecimal opening = acc.getOpeningBalance() != null ? acc.getOpeningBalance() : BigDecimal.ZERO;
    BigDecimal delta = ledgerRepo.sumSignedAmountByAccountId(accountId).orElse(BigDecimal.ZERO);
    return opening.add(delta);
  }
}
