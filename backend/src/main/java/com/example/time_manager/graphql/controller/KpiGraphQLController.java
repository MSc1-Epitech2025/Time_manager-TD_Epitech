package com.example.time_manager.graphql.controller;
import com.example.time_manager.model.kpi.GlobalKpiSummary;
import com.example.time_manager.model.kpi.TeamKpiSummary;
import com.example.time_manager.model.kpi.UserKpiSummary;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.KpiService;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;


import java.time.LocalDate;
import java.util.UUID;

@PreAuthorize("isAuthenticated()")
@Controller
public class KpiGraphQLController {

    private final KpiService kpiService;
    private final UserRepository userRepository;

    public KpiGraphQLController(KpiService kpiService,
                                UserRepository userRepository) {
        this.kpiService = kpiService;
        this.userRepository = userRepository;
    }

      @QueryMapping
  public UserKpiSummary myKpi(@Argument String startDate,
                              @Argument String endDate,
                              Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new AccessDeniedException("Authentication required");
    }

    String email = authentication.getName();
    var user = userRepository.findByEmail(email)
        .orElseThrow(() -> new AccessDeniedException("User not found for " + email));

    LocalDate start;
    LocalDate end;
    try {
      start = LocalDate.parse(startDate);
      end = LocalDate.parse(endDate);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid date format, expected yyyy-MM-dd", e);
    }

    UUID userId;
    try {
      userId = UUID.fromString(user.getId());
    } catch (Exception e) {
      throw new IllegalStateException("Invalid user id format: " + user.getId(), e);
    }

    return kpiService.getUser(userId, start, end);
  }


    @QueryMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','MANAGER')")
    public GlobalKpiSummary globalKpi(@Argument String startDate,
                                      @Argument String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end   = LocalDate.parse(endDate);
        return kpiService.getGlobal(start, end);
    }

    @QueryMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','MANAGER')")
    public TeamKpiSummary teamKpi(@Argument Integer teamId,
                                  @Argument String startDate,
                                  @Argument String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end   = LocalDate.parse(endDate);
        return kpiService.getTeam(teamId, start, end);
    }

    @QueryMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','MANAGER')")
    public UserKpiSummary userKpi(@Argument UUID userId,
                                  @Argument String startDate,
                                  @Argument String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end   = LocalDate.parse(endDate);
        return kpiService.getUser(userId, start, end);
    }
}
