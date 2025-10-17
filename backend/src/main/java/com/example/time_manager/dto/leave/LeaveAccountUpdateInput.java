package com.example.time_manager.dto.leave;

public class LeaveAccountUpdateInput {
  private Long id;
  private Float openingBalance;
  private Float accrualPerMonth;
  private Float maxCarryover;
  private String carryoverExpireOn;

  public LeaveAccountUpdateInput() {}
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Float getOpeningBalance() { return openingBalance; }
  public void setOpeningBalance(Float openingBalance) { this.openingBalance = openingBalance; }
  public Float getAccrualPerMonth() { return accrualPerMonth; }
  public void setAccrualPerMonth(Float accrualPerMonth) { this.accrualPerMonth = accrualPerMonth; }
  public Float getMaxCarryover() { return maxCarryover; }
  public void setMaxCarryover(Float maxCarryover) { this.maxCarryover = maxCarryover; }
  public String getCarryoverExpireOn() { return carryoverExpireOn; }
  public void setCarryoverExpireOn(String carryoverExpireOn) { this.carryoverExpireOn = carryoverExpireOn; }
}