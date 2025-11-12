package com.example.time_manager.model.kpi;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;


public class UserKpiSummary {
private UUID userId;
private String fullName;


private BigDecimal presenceRate; // % presence days / planned days
private BigDecimal avgHoursPerDay; // hours
private BigDecimal overtimeHours; // hours over planned
private PunctualityStats punctuality; // late rate + delay


private BigDecimal absenceDays; // total
private List<AbsenceBreakdown> absenceByType;


private List<LeaveBalance> leaveBalances; // VAC, RTT, ...


private Integer reportsAuthored; // by this user as manager
private Integer reportsReceived; // about this user

private LocalDate periodStart;
private LocalDate periodEnd;


public UserKpiSummary() {}


// getters/setters
public UUID getUserId() { return userId; }
public void setUserId(UUID userId) { this.userId = userId; }


public String getFullName() { return fullName; }
public void setFullName(String fullName) { this.fullName = fullName; }


public BigDecimal getPresenceRate() { return presenceRate; }
public void setPresenceRate(BigDecimal presenceRate) { this.presenceRate = presenceRate; }


public BigDecimal getAvgHoursPerDay() { return avgHoursPerDay; }
public void setAvgHoursPerDay(BigDecimal avgHoursPerDay) { this.avgHoursPerDay = avgHoursPerDay; }


public BigDecimal getOvertimeHours() { return overtimeHours; }
public void setOvertimeHours(BigDecimal overtimeHours) { this.overtimeHours = overtimeHours; }


public PunctualityStats getPunctuality() { return punctuality; }
public void setPunctuality(PunctualityStats punctuality) { this.punctuality = punctuality; }


public BigDecimal getAbsenceDays() { return absenceDays; }
public void setAbsenceDays(BigDecimal absenceDays) { this.absenceDays = absenceDays; }

public List<AbsenceBreakdown> getAbsenceByType() { return absenceByType; }
public void setAbsenceByType(List<AbsenceBreakdown> absenceByType) { this.absenceByType = absenceByType; }


public List<LeaveBalance> getLeaveBalances() { return leaveBalances; }
public void setLeaveBalances(List<LeaveBalance> leaveBalances) { this.leaveBalances = leaveBalances; }


public Integer getReportsAuthored() { return reportsAuthored; }
public void setReportsAuthored(Integer reportsAuthored) { this.reportsAuthored = reportsAuthored; }


public Integer getReportsReceived() { return reportsReceived; }
public void setReportsReceived(Integer reportsReceived) { this.reportsReceived = reportsReceived; }


public LocalDate getPeriodStart() { return periodStart; }
public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }


public LocalDate getPeriodEnd() { return periodEnd; }
public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }
}