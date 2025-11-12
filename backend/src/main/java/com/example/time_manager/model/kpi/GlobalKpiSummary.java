package com.example.time_manager.model.kpi;

import java.math.BigDecimal;
import java.time.LocalDate;

public class GlobalKpiSummary {

    private Integer headcount;
    private BigDecimal managersShare;      
    private BigDecimal adminsShare;        

    private BigDecimal presenceRate;       
    private BigDecimal avgHoursPerDay;     

    private BigDecimal totalAbsenceDays;   
    private BigDecimal absenceRate;        
    private BigDecimal approvalDelayHours; 

    private Integer totalReports;          

    private LocalDate periodStart;
    private LocalDate periodEnd;

    public GlobalKpiSummary() {}

    public Integer getHeadcount() { return headcount; }
    public void setHeadcount(Integer headcount) { this.headcount = headcount; }

    public BigDecimal getManagersShare() { return managersShare; }
    public void setManagersShare(BigDecimal managersShare) { this.managersShare = managersShare; }

    public BigDecimal getAdminsShare() { return adminsShare; }
    public void setAdminsShare(BigDecimal adminsShare) { this.adminsShare = adminsShare; }

    public BigDecimal getPresenceRate() { return presenceRate; }
    public void setPresenceRate(BigDecimal presenceRate) { this.presenceRate = presenceRate; }

    public BigDecimal getAvgHoursPerDay() { return avgHoursPerDay; }
    public void setAvgHoursPerDay(BigDecimal avgHoursPerDay) { this.avgHoursPerDay = avgHoursPerDay; }

    public BigDecimal getTotalAbsenceDays() { return totalAbsenceDays; }
    public void setTotalAbsenceDays(BigDecimal totalAbsenceDays) { this.totalAbsenceDays = totalAbsenceDays; }

    public BigDecimal getAbsenceRate() { return absenceRate; }
    public void setAbsenceRate(BigDecimal absenceRate) { this.absenceRate = absenceRate; }

    public BigDecimal getApprovalDelayHours() { return approvalDelayHours; }
    public void setApprovalDelayHours(BigDecimal approvalDelayHours) { this.approvalDelayHours = approvalDelayHours; }

    public Integer getTotalReports() { return totalReports; }
    public void setTotalReports(Integer totalReports) { this.totalReports = totalReports; }

    public LocalDate getPeriodStart() { return periodStart; }
    public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }

    public LocalDate getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }
}
