// src/main/java/com/example/time_manager/graphql/controller/WorkScheduleController.java

package com.example.time_manager.graphql.controller;

import com.example.time_manager.dto.work_schedule.WorkScheduleBatchRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleResponse;
import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.security.WorkScheduleAccess;
import com.example.time_manager.service.WorkScheduleService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Controller
@Validated
public class WorkScheduleController {

  private final WorkScheduleService workScheduleService;
  private final UserRepository userRepository;
  private final WorkScheduleAccess access;

  public WorkScheduleController(WorkScheduleService workScheduleService,
                                UserRepository userRepository,
                                WorkScheduleAccess access) {
    this.workScheduleService = workScheduleService;
    this.userRepository = userRepository;
    this.access = access;
  }

  /* ========================= QUERIES ========================= */

  @QueryMapping
  public List<WorkScheduleResponse> workSchedulesByUser(@Argument String userId) {
    return workScheduleService.listForUser(userId);
  }

  @QueryMapping
  public List<WorkScheduleResponse> myWorkSchedules() {
    return workScheduleService.listForUser(currentUserId());
  }

  /* ======================== MUTATIONS ======================== */

  @MutationMapping
  public WorkScheduleResponse upsertMyWorkSchedule(@Argument("input") @Valid WorkScheduleRequest input) {
    String me = currentUserId();
    access.assertCanSelfManage(me);                    // <-- bloque EMPLOYEE
    return workScheduleService.upsertForUser(me, input);
  }

  @MutationMapping
  public Boolean deleteMyWorkScheduleSlot(@Argument WorkDay day, @Argument WorkPeriod period) {
    String me = currentUserId();
    access.assertCanSelfManage(me);                    // <-- bloque EMPLOYEE
    workScheduleService.deleteSlot(me, day, period);
    return true;
  }

  // Les mutations ciblant un autre user restent protégées par assertCanManage(...)
  @MutationMapping
  public WorkScheduleResponse upsertWorkSchedule(@Argument String userId, @Argument("input") @Valid WorkScheduleRequest input) {
    access.assertCanManage(currentUserId(), userId);
    return workScheduleService.upsertForUser(userId, input);
  }

  @MutationMapping
  public List<WorkScheduleResponse> upsertWorkScheduleBatch(@Argument String userId, @Argument("batch") @Valid WorkScheduleBatchRequest batch) {
    access.assertCanManage(currentUserId(), userId);
    return workScheduleService.batchUpsertForUser(userId, batch);
  }

  @MutationMapping
  public Boolean deleteWorkScheduleSlot(@Argument String userId, @Argument WorkDay day, @Argument WorkPeriod period) {
    access.assertCanManage(currentUserId(), userId);
    workScheduleService.deleteSlot(userId, day, period);
    return true;
  }
  /* ======================= Helpers ======================= */

  private String currentUserId() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || auth.getName() == null) {
      throw new EntityNotFoundException("No authenticated user found");
    }
    return userRepository.findByEmail(auth.getName())
        .map(u -> u.getId())
        .orElseThrow(() -> new EntityNotFoundException("User not found by email: " + auth.getName()));
  }
}
