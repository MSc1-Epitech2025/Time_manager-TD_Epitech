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

  /** ADMIN only : all reports */
  @QueryMapping
  @PreAuthorize("hasAuthority('ADMIN')")
  public List<ReportResponse> reports(Authentication auth) {
    return reportService.listAllForAdmin(auth.getName());
  }

  /** Reports I created */
  @QueryMapping
  public List<ReportResponse> myReports(Authentication auth) {
    return reportService.listAuthoredByEmail(auth.getName());
  }

  /** Reports where I am the target */
  @QueryMapping
  public List<ReportResponse> reportsForMe(Authentication auth) {
    return reportService.listReceivedByEmail(auth.getName());
  }

  /** Single report (visible if admin / author / target) */
  @QueryMapping
  public ReportResponse report(@Argument Long id, Authentication auth) {
    return reportService.getVisibleTo(auth.getName(), id);
  }

  /* ======================== MUTATIONS ======================== */

  /** Manual report creation */
  @MutationMapping
  public ReportResponse createReport(
      @Argument("input") @Valid ReportCreateRequest input,
      Authentication auth
  ) {
    return reportService.createForAuthorEmail(auth.getName(), input);
  }

  /** Update report (admin or author) */
  @MutationMapping
  public ReportResponse updateReport(
      @Argument Long id,
      @Argument("input") @Valid ReportUpdateRequest input,
      Authentication auth
  ) {
    return reportService.updateVisibleTo(auth.getName(), id, input);
  }

  /** Delete report (admin or author) */
  @MutationMapping
  public Boolean deleteReport(@Argument Long id, Authentication auth) {
    reportService.deleteVisibleTo(auth.getName(), id);
    return true;
  }
}
