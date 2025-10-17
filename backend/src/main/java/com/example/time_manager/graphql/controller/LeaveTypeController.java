// src/main/java/com/example/time_manager/graphql/controller/leave/LeaveTypeController.java
package com.example.time_manager.graphql.controller;

import com.example.time_manager.dto.leave.LeaveTypeCreateInput;
import com.example.time_manager.dto.leave.LeaveTypeUpdateInput;
import com.example.time_manager.model.leave.LeaveType;
import com.example.time_manager.service.leave.LeaveTypeService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@PreAuthorize("isAuthenticated()")
@Controller
public class LeaveTypeController {
  private final LeaveTypeService service;
  public LeaveTypeController(LeaveTypeService service) { this.service = service; }

  @QueryMapping
  public List<LeaveType> leaveTypes() { return service.listAll(); }

  @QueryMapping
  public LeaveType leaveType(@Argument String code) { return service.getByCode(code); }

  @PreAuthorize("hasAnyRole('ADMIN')")
  @MutationMapping
  public LeaveType createLeaveType(@Argument LeaveTypeCreateInput input) {
    return service.create(input.getCode(), input.getLabel());
  }

  @PreAuthorize("hasAnyRole('ADMIN')")
  @MutationMapping
  public LeaveType updateLeaveType(@Argument LeaveTypeUpdateInput input) {
    return service.update(input.getCode(), input.getLabel());
  }

  @PreAuthorize("hasAnyRole('ADMIN')")
  @MutationMapping
  public Boolean deleteLeaveType(@Argument String code) {
    return service.delete(code);
  }
}
