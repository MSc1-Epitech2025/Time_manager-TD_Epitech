package com.example.time_manager.dto.leave;

public class LeaveTypeUpdateInput {
  
  private String code;
  private String label;
  public LeaveTypeUpdateInput() {}
  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
  public String getLabel() { return label; }
  public void setLabel(String label) { this.label = label; }
}
