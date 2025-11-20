package com.example.time_manager.graphql.controller;

import com.example.time_manager.dto.kpi.KpiFullDataResponse;
import com.example.time_manager.service.KpiService;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class KpiController {

    private final KpiService kpiService;

    public KpiController(KpiService kpiService) {
        this.kpiService = kpiService;
    }

    @QueryMapping
    public KpiFullDataResponse kpiFullData() {
        return kpiService.getFullData();
    }
}
