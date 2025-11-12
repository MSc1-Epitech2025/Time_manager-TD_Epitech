package com.example.time_manager.model.leave;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "leave_types")
public class LeaveType {
  @Id
  @Column(length = 20)
  private String code;

  @Column(nullable = false, length = 100)
  private String label;

  public LeaveType() {}
  public LeaveType(String code, String label) { this.code = code; this.label = label; }

  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
  public String getLabel() { return label; }
  public void setLabel(String label) { this.label = label; }
}
