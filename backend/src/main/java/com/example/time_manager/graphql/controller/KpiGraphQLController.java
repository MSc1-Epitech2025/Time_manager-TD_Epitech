// src/main/java/com/example/time_manager/graphql/controller/KpiGraphQLController.java
package com.example.time_manager.graphql.controller;

import com.example.time_manager.dto.kpi.KpiGlobal;
import com.example.time_manager.dto.kpi.KpiTeam;
import com.example.time_manager.dto.kpi.KpiUser;
import com.example.time_manager.service.KpiService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;

@Controller
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class KpiGraphQLController {

    private final KpiService kpiService;

    public KpiGraphQLController(KpiService kpiService) {
        this.kpiService = kpiService;
    }

    @QueryMapping
    public KpiGlobal kpiGlobal(@Argument LocalDate from, @Argument LocalDate to) {
        LocalDate[] r = normalizeRange(from, to);
        return kpiService.kpiGlobal(r[0], r[1]);
    }

    @QueryMapping
    public KpiUser kpiByUser(@Argument String userId,
                             @Argument LocalDate from,
                             @Argument LocalDate to) {
        LocalDate[] r = normalizeRange(from, to);
        return kpiService.kpiByUser(userId, r[0], r[1]);
    }

    @QueryMapping
    public KpiTeam kpiByTeam(@Argument Long teamId,
                             @Argument LocalDate from,
                             @Argument LocalDate to) {
        LocalDate[] r = normalizeRange(from, to);
        return kpiService.kpiByTeam(teamId, r[0], r[1]);
    }

    private static LocalDate[] normalizeRange(LocalDate from, LocalDate to) {
        LocalDate now = LocalDate.now();
        LocalDate f = (from != null) ? from : now.withDayOfMonth(1);
        LocalDate t = (to != null) ? to : now.withDayOfMonth(now.lengthOfMonth());
        if (t.isBefore(f)) { LocalDate tmp = f; f = t; t = tmp; }
        return new LocalDate[]{f, t};
    }
}
