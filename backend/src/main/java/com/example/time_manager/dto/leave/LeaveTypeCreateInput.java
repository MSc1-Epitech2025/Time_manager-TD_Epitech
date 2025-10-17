package com.example.time_manager.dto.leave;

public class LeaveTypeCreateInput {
  private String code;
  private String label;
  public LeaveTypeCreateInput() {}
  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
  public String getLabel() { return label; }
  public void setLabel(String label) { this.label = label; }
}

