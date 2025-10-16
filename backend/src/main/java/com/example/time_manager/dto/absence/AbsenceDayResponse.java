package com.example.time_manager.dto.absence;

import java.time.LocalDate;
import java.time.LocalTime;
import com.example.time_manager.model.absence.AbsencePeriod;


public class AbsenceDayResponse {
  private Long id;
  private java.time.LocalDate absenceDate;
  private com.example.time_manager.model.absence.AbsencePeriod period;
  private java.time.LocalTime startTime;
  private java.time.LocalTime endTime;

  public AbsenceDayResponse() {}

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public LocalDate getAbsenceDate() { return absenceDate; }
  public void setAbsenceDate(LocalDate absenceDate) { this.absenceDate = absenceDate; }

  public AbsencePeriod getPeriod() { return period; }
  public void setPeriod(AbsencePeriod period) { this.period = period; }

  public LocalTime getStartTime() { return startTime; }
  public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

  public LocalTime getEndTime() { return endTime; }
  public void setEndTime(LocalTime endTime) { this.endTime = endTime;}
}
