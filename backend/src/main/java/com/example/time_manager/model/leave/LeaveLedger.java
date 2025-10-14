package com.example.time_manager.model.leave;

import com.example.time_manager.model.absence.Absence;


import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
  name = "leave_ledger",
  indexes = {
    @Index(name = "idx_ledger_account_date", columnList = "account_id, entry_date"),
    @Index(name = "idx_ledger_ref_absence", columnList = "reference_absence_id")
  }
)
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
  @Column(name = "kind", nullable = false, length = 20)
  private LeaveKind kind;

  @Column(name = "amount", nullable = false, precision = 6, scale = 2)
  private BigDecimal amount;
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "reference_absence_id")
  private Absence referenceAbsence; // nullable

  @Column(name = "note", length = 255)
  private String note;

  @Column(name = "created_at", updatable = false)
  private Instant createdAt;

  /* ===== Lifecycle ===== */
  @PrePersist
  public void prePersist() {
    if (createdAt == null) createdAt = Instant.now();
  }

  /* ===== Getters / Setters ===== */
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public LeaveAccount getAccount() { return account; }
  public void setAccount(LeaveAccount account) { this.account = account; }

  public LocalDate getEntryDate() { return entryDate; }
  public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }

  public LeaveKind getKind() { return kind; }
  public void setKind(LeaveKind kind) { this.kind = kind; }

  public BigDecimal getAmount() { return amount; }
  public void setAmount(BigDecimal amount) { this.amount = amount; }

  public Absence getReferenceAbsence() { return referenceAbsence; }
  public void setReferenceAbsence(Absence referenceAbsence) { this.referenceAbsence = referenceAbsence; }

  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
