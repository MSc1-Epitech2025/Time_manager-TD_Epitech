package com.example.time_manager.graphql.controller;

import java.util.List;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.example.time_manager.dto.report.ReportCreateRequest;
import com.example.time_manager.dto.report.ReportResponse;
import com.example.time_manager.dto.report.ReportUpdateRequest;
import com.example.time_manager.service.ReportService;

import jakarta.validation.Valid;

@PreAuthorize("isAuthenticated()")
@Controller
public class ReportGraphQLController {

    private final ReportService reportService;

    public ReportGraphQLController(ReportService reportService) {
        this.reportService = reportService;
    }

    /* ======================== QUERIES ======================== */

    @QueryMapping
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ADMIN')")
    public List<ReportResponse> reports() {
        return reportService.listAll();
    }

    @QueryMapping
    public List<ReportResponse> myReports(Authentication auth) {
        String email = auth.getName();
        return reportService.listMineByEmail(email);
    }

    @QueryMapping
    public List<ReportResponse> reportsForMe(Authentication auth) {
        String email = auth.getName();
        return reportService.listReceivedByEmail(email);
    }

    @QueryMapping
    public ReportResponse report(@Argument Long id, Authentication auth) {
        String email = auth.getName();
        return reportService.loadVisibleByEmail(email, id);
    }

    /* ======================== MUTATIONS ======================== */

    @MutationMapping
    public ReportResponse createReport(
        @Argument("input") @Valid ReportCreateRequest input,
        Authentication auth
    ) {
        String email = auth.getName();
        return reportService.create(email, input);
    }

    @MutationMapping
    public ReportResponse updateReport(
        @Argument("id") Long id,                            
        @Argument("input") @Valid ReportUpdateRequest input,
        Authentication auth
    ) {
        String email = auth.getName();
        return reportService.update(email, id, input);
    }
    @MutationMapping
    public Boolean deleteReport(@Argument Long id, Authentication auth) {
        String email = auth.getName();
        reportService.delete(email, id);
        return true;
    }
}
