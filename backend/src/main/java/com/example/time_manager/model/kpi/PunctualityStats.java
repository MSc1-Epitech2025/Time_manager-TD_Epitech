package com.example.time_manager.model.kpi;

import java.math.BigDecimal;


public class PunctualityStats {
private BigDecimal lateRate; // % of days with late IN
private BigDecimal avgDelayMinutes; // average minutes late on late days


public PunctualityStats() {}


public PunctualityStats(BigDecimal lateRate, BigDecimal avgDelayMinutes) {
this.lateRate = lateRate;
this.avgDelayMinutes = avgDelayMinutes;
}


public BigDecimal getLateRate() { return lateRate; }
public void setLateRate(BigDecimal lateRate) { this.lateRate = lateRate; }


public BigDecimal getAvgDelayMinutes() { return avgDelayMinutes; }
public void setAvgDelayMinutes(BigDecimal avgDelayMinutes) { this.avgDelayMinutes = avgDelayMinutes; }
}