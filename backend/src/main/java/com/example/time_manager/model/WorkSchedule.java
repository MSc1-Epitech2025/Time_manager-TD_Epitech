package com.example.time_manager.model;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "work_schedules",
       uniqueConstraints = @UniqueConstraint(name = "uk_user_day_period", columnNames = {"user_id","day_of_week","period"}))
public class WorkSchedule {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(name = "day_of_week", nullable = false, length = 3)
  private WorkDay dayOfWeek;

  @Enumerated(EnumType.STRING)
  @Column(name = "period", nullable = false, length = 2)
  private WorkPeriod period;

  @Column(name = "start_time", nullable = false)
  private LocalTime startTime;

  @Column(name = "end_time", nullable = false)
  private LocalTime endTime;

  // getters/setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }

  public WorkDay getDayOfWeek() { return dayOfWeek; }
  public void setDayOfWeek(WorkDay dayOfWeek) { this.dayOfWeek = dayOfWeek; }

  public WorkPeriod getPeriod() { return period; }
  public void setPeriod(WorkPeriod period) { this.period = period; }

  public LocalTime getStartTime() { return startTime; }
  public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
  
  public LocalTime getEndTime() { return endTime; }
  public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}
