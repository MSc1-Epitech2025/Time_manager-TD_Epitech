package com.example.time_manager.model.absence;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "absence_days")
public class AbsenceDay {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** Parent absence (ON DELETE CASCADE en DB) */
  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "absence_id", referencedColumnName = "id", nullable = false)
  private Absence absence;

  /** Date of this absence segment (YYYY-MM-DD) */
  @Column(name = "absence_date", nullable = false)
  private LocalDate absenceDate;

  /** AM, PM or FULL_DAY (default FULL_DAY) */
  @Enumerated(EnumType.STRING)
  @Column(name = "period", nullable = false, length = 10)
  private AbsencePeriod period = AbsencePeriod.FULL_DAY;

  /** Optional time window for AM/PM; null for FULL_DAY unless you define defaults */
  @Column(name = "start_time")
  private LocalTime startTime;

  @Column(name = "end_time")
  private LocalTime endTime;

  // ===== Getters / Setters =====

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

  @Transient
  public boolean isFullDay() { return period == AbsencePeriod.FULL_DAY; }

  @Override
  public String toString() {
    return "AbsenceDay{" +
        "id=" + id +
        ", date=" + absenceDate +
        ", period=" + period +
        ", startTime=" + startTime +
        ", endTime=" + endTime +
        '}';
  }
}
