package com.example.time_manager.model.kpi;

import java.math.BigDecimal;


public class AbsenceBreakdown {
private String type; // SICK, VACATION, PERSONAL, FORMATION, OTHER, RTT
private BigDecimal days; // in days (AM/PM = 0.5)


public AbsenceBreakdown() {}


public AbsenceBreakdown(String type, BigDecimal days) {
this.type = type;
this.days = days;
}


public String getType() { return type; }
public void setType(String type) { this.type = type; }


public BigDecimal getDays() { return days; }
public void setDays(BigDecimal days) { this.days = days; }
}