package com.example.time_manager.model;

import jakarta.persistence.*;
import java.time.LocalTime;


@Entity
@Table(name = "work_schedules", uniqueConstraints = {
@UniqueConstraint(name = "uk_ws_user_day_period", columnNames = {"user_id", "day_of_week", "period"})
})
public class WorkSchedule {


@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;


@Column(name = "user_id", nullable = false, columnDefinition = "char(36)")
private String userId;


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


// Getters / Setters
public Long getId() { return id; }
public void setId(Long id) { this.id = id; }


public String getUserId() { return userId; }
public void setUserId(String userId) { this.userId = userId; }


public WorkDay getDayOfWeek() { return dayOfWeek; }
public void setDayOfWeek(WorkDay dayOfWeek) { this.dayOfWeek = dayOfWeek; }


public WorkPeriod getPeriod() { return period; }
public void setPeriod(WorkPeriod period) { this.period = period; }


public LocalTime getStartTime() { return startTime; }
public void setStartTime(LocalTime startTime) { this.startTime = startTime; }


public LocalTime getEndTime() { return endTime; }
public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}