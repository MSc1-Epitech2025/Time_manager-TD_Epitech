package com.example.time_manager.model.kpi;

import java.math.BigDecimal;
import java.time.LocalDate;


public class TeamKpiSummary {
private Integer teamId;
private String teamName;
private Integer headcount;


private BigDecimal presenceRate;
private BigDecimal avgHoursPerDay;
private BigDecimal absenceRate; // absent days / planned days


private Integer reportsAuthored; // by team managers


private LocalDate periodStart;
private LocalDate periodEnd;


public Integer getTeamId() { return teamId; }
public void setTeamId(Integer teamId) { this.teamId = teamId; }


public String getTeamName() { return teamName; }
public void setTeamName(String teamName) { this.teamName = teamName; }


public Integer getHeadcount() { return headcount; }
public void setHeadcount(Integer headcount) { this.headcount = headcount; }


public BigDecimal getPresenceRate() { return presenceRate; }
public void setPresenceRate(BigDecimal presenceRate) { this.presenceRate = presenceRate; }


public BigDecimal getAvgHoursPerDay() { return avgHoursPerDay; }
public void setAvgHoursPerDay(BigDecimal avgHoursPerDay) { this.avgHoursPerDay = avgHoursPerDay; }


public BigDecimal getAbsenceRate() { return absenceRate; }
public void setAbsenceRate(BigDecimal absenceRate) { this.absenceRate = absenceRate; }


public Integer getReportsAuthored() { return reportsAuthored; }
public void setReportsAuthored(Integer reportsAuthored) { this.reportsAuthored = reportsAuthored; }


public LocalDate getPeriodStart() { return periodStart; }
public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }


public LocalDate getPeriodEnd() { return periodEnd; }
public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }
}