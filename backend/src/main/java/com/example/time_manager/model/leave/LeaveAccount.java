package com.example.time_manager.model.leave;

import com.example.time_manager.model.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
  name = "leave_accounts",
  uniqueConstraints = @UniqueConstraint(name = "uq_leave_account", columnNames = {"user_id","leave_type"})
)
public class LeaveAccount {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "leave_type", referencedColumnName = "code", nullable = false)
  private LeaveType leaveType;

  @Column(name = "opening_balance", precision = 6, scale = 2)
  private BigDecimal openingBalance = BigDecimal.ZERO;

  @Column(name = "accrual_per_month", precision = 5, scale = 3)
  private BigDecimal accrualPerMonth = BigDecimal.ZERO;

  @Column(name = "max_carryover", precision = 6, scale = 2)
  private BigDecimal maxCarryover;

  @Column(name = "carryover_expire_on")
  private LocalDate carryoverExpireOn;

  @Column(name = "created_at", updatable = false, insertable = false)
  private Instant createdAt;

  public LeaveAccount() {}

  // Getters / Setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }
  public LeaveType getLeaveType() { return leaveType; }
  public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }
  public BigDecimal getOpeningBalance() { return openingBalance; }
  public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
  public BigDecimal getAccrualPerMonth() { return accrualPerMonth; }
  public void setAccrualPerMonth(BigDecimal accrualPerMonth) { this.accrualPerMonth = accrualPerMonth; }
  public BigDecimal getMaxCarryover() { return maxCarryover; }
  public void setMaxCarryover(BigDecimal maxCarryover) { this.maxCarryover = maxCarryover; }
  public LocalDate getCarryoverExpireOn() { return carryoverExpireOn; }
  public void setCarryoverExpireOn(LocalDate carryoverExpireOn) { this.carryoverExpireOn = carryoverExpireOn; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
