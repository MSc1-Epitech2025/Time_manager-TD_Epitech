package com.example.time_manager.graphql.controller;

import com.example.time_manager.dto.leave.LeaveLedgerCreateInput;
import com.example.time_manager.dto.leave.LeaveLedgerUpdateInput;
import com.example.time_manager.model.leave.LeaveLedger;
import com.example.time_manager.model.leave.LeaveLedgerKind;
import com.example.time_manager.service.leave.LeaveLedgerService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.security.access.prepost.PreAuthorize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@PreAuthorize("isAuthenticated()")
@Controller
public class LeaveLedgerController {
  private final LeaveLedgerService service;
  public LeaveLedgerController(LeaveLedgerService service) { this.service = service; }

  @QueryMapping
  public List<LeaveLedger> leaveLedgerByAccount(@Argument Long accountId,
                                                @Argument String from,
                                                @Argument String to) {
    if (from != null && to != null) {
      return service.listByAccountBetween(accountId, LocalDate.parse(from), LocalDate.parse(to));
    }
    return service.listByAccount(accountId);
  }
  @PreAuthorize("hasAnyRole('ADMIN')")
  @MutationMapping
  public LeaveLedger addLeaveLedgerEntry(@Argument LeaveLedgerCreateInput input) {
    LocalDate date = input.getEntryDate() != null ? LocalDate.parse(input.getEntryDate()) : null;
    LeaveLedgerKind kind = LeaveLedgerKind.valueOf(input.getKind());
    BigDecimal amount = input.getAmount() != null ? BigDecimal.valueOf(input.getAmount()) : null;
    return service.addEntry(input.getAccountId(), date, kind, amount, input.getReferenceAbsenceId(), input.getNote());
  }
  @PreAuthorize("hasAnyRole('ADMIN')")
  @MutationMapping
  public LeaveLedger updateLeaveLedgerEntry(@Argument LeaveLedgerUpdateInput input) {
    LocalDate date = input.getEntryDate() != null ? LocalDate.parse(input.getEntryDate()) : null;
    BigDecimal amount = input.getAmount() != null ? BigDecimal.valueOf(input.getAmount()) : null;
    return service.update(input.getId(), date, amount, input.getNote());
  }
  @PreAuthorize("hasAnyRole('ADMIN')")
  @MutationMapping
  public Boolean deleteLeaveLedgerEntry(@Argument Long id) {
    return service.delete(id);
  }
}
