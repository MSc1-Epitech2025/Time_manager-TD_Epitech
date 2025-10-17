package com.example.time_manager.dto.leave;

public class LeaveAccountCreateInput {
  private String userId;
  private String leaveTypeCode;
  private Float openingBalance;
  private Float accrualPerMonth;
  private Float maxCarryover;
  private String carryoverExpireOn;

  public LeaveAccountCreateInput() {}
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getLeaveTypeCode() { return leaveTypeCode; }
  public void setLeaveTypeCode(String leaveTypeCode) { this.leaveTypeCode = leaveTypeCode; }
  public Float getOpeningBalance() { return openingBalance; }
  public void setOpeningBalance(Float openingBalance) { this.openingBalance = openingBalance; }
  public Float getAccrualPerMonth() { return accrualPerMonth; }
  public void setAccrualPerMonth(Float accrualPerMonth) { this.accrualPerMonth = accrualPerMonth; }
  public Float getMaxCarryover() { return maxCarryover; }
  public void setMaxCarryover(Float maxCarryover) { this.maxCarryover = maxCarryover; }
  public String getCarryoverExpireOn() { return carryoverExpireOn; }
  public void setCarryoverExpireOn(String carryoverExpireOn) { this.carryoverExpireOn = carryoverExpireOn; }
}