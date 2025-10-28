// src/main/java/com/example/time_manager/graphql/controller/leave/LeaveAccountController.java
package com.example.time_manager.graphql.controller;

import com.example.time_manager.dto.leave.LeaveAccountCreateInput;
import com.example.time_manager.dto.leave.LeaveAccountUpdateInput;
import com.example.time_manager.model.leave.LeaveAccount;
import com.example.time_manager.service.leave.LeaveAccountService;
import org.springframework.graphql.data.method.annotation.*;
import org.springframework.stereotype.Controller;
import org.springframework.security.access.prepost.PreAuthorize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@PreAuthorize("isAuthenticated()")
@Controller
public class LeaveAccountController {
  private final LeaveAccountService service;
  public LeaveAccountController(LeaveAccountService service) { this.service = service; }

  @QueryMapping
  public LeaveAccount leaveAccount(@Argument Long id) { return service.get(id); }

  @QueryMapping
  public List<LeaveAccount> leaveAccountsByUser(@Argument String userId) {
    return service.listByUser(userId);
  }

  @SchemaMapping(typeName = "LeaveAccount", field = "currentBalance")
  public Double currentBalance(LeaveAccount account) {
    BigDecimal v = service.computeCurrentBalance(account.getId());
    return v.doubleValue();
  }

  @PreAuthorize("hasAuthority('ADMIN')")
  @MutationMapping
  public LeaveAccount createLeaveAccount(@Argument LeaveAccountCreateInput input) {
    BigDecimal opening = input.getOpeningBalance() != null ? BigDecimal.valueOf(input.getOpeningBalance()) : null;
    BigDecimal accrual = input.getAccrualPerMonth() != null ? BigDecimal.valueOf(input.getAccrualPerMonth()) : null;
    BigDecimal maxCarry = input.getMaxCarryover() != null ? BigDecimal.valueOf(input.getMaxCarryover()) : null;
    LocalDate expireOn = input.getCarryoverExpireOn() != null ? LocalDate.parse(input.getCarryoverExpireOn()) : null;
    return service.create(input.getUserId(), input.getLeaveTypeCode(), opening, accrual, maxCarry, expireOn);
  }

  @PreAuthorize("hasAuthority('ADMIN')")
  @MutationMapping
  public LeaveAccount updateLeaveAccount(@Argument LeaveAccountUpdateInput input) {
    BigDecimal opening = input.getOpeningBalance() != null ? BigDecimal.valueOf(input.getOpeningBalance()) : null;
    BigDecimal accrual = input.getAccrualPerMonth() != null ? BigDecimal.valueOf(input.getAccrualPerMonth()) : null;
    BigDecimal maxCarry = input.getMaxCarryover() != null ? BigDecimal.valueOf(input.getMaxCarryover()) : null;
    LocalDate expireOn = input.getCarryoverExpireOn() != null ? LocalDate.parse(input.getCarryoverExpireOn()) : null;
    return service.update(input.getId(), opening, accrual, maxCarry, expireOn);
  }
  @PreAuthorize("hasAuthority('ADMIN')")
  @MutationMapping
  public Boolean deleteLeaveAccount(@Argument Long id) { return service.delete(id); }
}
