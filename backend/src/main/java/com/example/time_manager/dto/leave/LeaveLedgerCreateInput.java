package com.example.time_manager.dto.leave;

public class LeaveLedgerCreateInput {
  private Long accountId;
  private String entryDate;  // ISO yyyy-MM-dd
  private String kind;       // ACCRUAL | DEBIT | ADJUSTMENT | CARRYOVER_EXPIRE
  private Float amount;
  private Long referenceAbsenceId;
  private String note;

  public LeaveLedgerCreateInput() {}
  public Long getAccountId() { return accountId; }
  public void setAccountId(Long accountId) { this.accountId = accountId; }
  public String getEntryDate() { return entryDate; }
  public void setEntryDate(String entryDate) { this.entryDate = entryDate; }
  public String getKind() { return kind; }
  public void setKind(String kind) { this.kind = kind; }
  public Float getAmount() { return amount; }
  public void setAmount(Float amount) { this.amount = amount; }
  public Long getReferenceAbsenceId() { return referenceAbsenceId; }
  public void setReferenceAbsenceId(Long referenceAbsenceId) { this.referenceAbsenceId = referenceAbsenceId; }
  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }
}
