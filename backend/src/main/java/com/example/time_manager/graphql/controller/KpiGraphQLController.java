package com.example.time_manager.graphql.controller;

import com.example.time_manager.model.kpi.GlobalKpiSummary;
import com.example.time_manager.model.kpi.TeamKpiSummary;
import com.example.time_manager.model.kpi.UserKpiSummary;
import com.example.time_manager.service.KpiService;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;
import java.util.UUID;

@Controller
public class KpiGraphQLController {

    private final KpiService kpiService;

    public KpiGraphQLController(KpiService kpiService) {
        this.kpiService = kpiService;
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
