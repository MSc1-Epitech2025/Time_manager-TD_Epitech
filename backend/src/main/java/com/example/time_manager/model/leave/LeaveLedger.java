package com.example.time_manager.model.leave;

import com.example.time_manager.model.absence.Absence;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "leave_ledger",
       indexes = {@Index(name = "idx_ledger_account_date", columnList = "account_id,entry_date")})
public class LeaveLedger {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "account_id", nullable = false)
  private LeaveAccount account;

  @Column(name = "entry_date", nullable = false)
  private LocalDate entryDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private LeaveLedgerKind kind;

  @Column(precision = 6, scale = 2, nullable = false)
  private BigDecimal amount;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "reference_absence_id")
  private Absence referenceAbsence;

  @Column(length = 255)
  private String note;

  @Column(name = "created_at", updatable = false, insertable = false)
  private Instant createdAt;

  // Getters / Setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public LeaveAccount getAccount() { return account; }
  public void setAccount(LeaveAccount account) { this.account = account; }
  public LocalDate getEntryDate() { return entryDate; }
  public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }
  public LeaveLedgerKind getKind() { return kind; }
  public void setKind(LeaveLedgerKind kind) { this.kind = kind; }
  public BigDecimal getAmount() { return amount; }
  public void setAmount(BigDecimal amount) { this.amount = amount; }
  public Absence getReferenceAbsence() { return referenceAbsence; }
  public void setReferenceAbsence(Absence referenceAbsence) { this.referenceAbsence = referenceAbsence; }
  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
