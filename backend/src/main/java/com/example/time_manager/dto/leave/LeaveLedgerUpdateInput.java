package com.example.time_manager.dto.leave;

public class LeaveLedgerUpdateInput {
  private Long id;
  private String entryDate;
  private Float amount;
  private String note;

  public LeaveLedgerUpdateInput() {}
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getEntryDate() { return entryDate; }
  public void setEntryDate(String entryDate) { this.entryDate = entryDate; }
  public Float getAmount() { return amount; }
  public void setAmount(Float amount) { this.amount = amount; }
  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }
}