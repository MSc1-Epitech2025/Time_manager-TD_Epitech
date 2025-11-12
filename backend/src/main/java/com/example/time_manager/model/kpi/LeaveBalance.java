package com.example.time_manager.model.kpi;

import java.math.BigDecimal;


public class LeaveBalance {
private String leaveType; 
private BigDecimal openingBalance;
private BigDecimal accrued; 
private BigDecimal debited; 
private BigDecimal adjustments; 
private BigDecimal expired;
private BigDecimal currentBalance;


public LeaveBalance() {}


public LeaveBalance(String leaveType, BigDecimal openingBalance, BigDecimal accrued,
BigDecimal debited, BigDecimal adjustments, BigDecimal expired,
BigDecimal currentBalance) {
this.leaveType = leaveType;
this.openingBalance = openingBalance;
this.accrued = accrued;
this.debited = debited;
this.adjustments = adjustments;
this.expired = expired;
this.currentBalance = currentBalance;
}


public String getLeaveType() { return leaveType; }
public void setLeaveType(String leaveType) { this.leaveType = leaveType; }


public BigDecimal getOpeningBalance() { return openingBalance; }
public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }


public BigDecimal getAccrued() { return accrued; }
public void setAccrued(BigDecimal accrued) { this.accrued = accrued; }


public BigDecimal getDebited() { return debited; }
public void setDebited(BigDecimal debited) { this.debited = debited; }


public BigDecimal getAdjustments() { return adjustments; }
public void setAdjustments(BigDecimal adjustments) { this.adjustments = adjustments; }


public BigDecimal getExpired() { return expired; }
public void setExpired(BigDecimal expired) { this.expired = expired; }


public BigDecimal getCurrentBalance() { return currentBalance; }
public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }
}