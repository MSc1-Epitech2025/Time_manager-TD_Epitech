package com.example.time_manager.model.absence;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "absence_days")
public class AbsenceDay {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id", updatable = false, nullable = false)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "absence_id", nullable = false)
  private Absence absence;

  @Column(name = "absence_date", nullable = false)
  private LocalDate absenceDate;

  @Enumerated(EnumType.STRING)
  @Column(name = "period", nullable = false, length = 20)
  private AbsencePeriod period = AbsencePeriod.FULL_DAY;

  @Column(name = "start_time")
  private LocalTime startTime;

  @Column(name = "end_time")
  private LocalTime endTime;

  public AbsenceDay() {}

  // Getters / Setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public Absence getAbsence() { return absence; }
  public void setAbsence(Absence absence) { this.absence = absence; }

  public LocalDate getAbsenceDate() { return absenceDate; }
  public void setAbsenceDate(LocalDate absenceDate) { this.absenceDate = absenceDate; }

  public AbsencePeriod getPeriod() { return period; }
  public void setPeriod(AbsencePeriod period) { this.period = period; }

  public LocalTime getStartTime() { return startTime; }
  public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

  public LocalTime getEndTime() { return endTime; }
  public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}
