package com.example.time_manager.graphql.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;

import com.example.time_manager.dto.absence.AbsenceCreateRequest;
import com.example.time_manager.dto.absence.AbsenceResponse;
import com.example.time_manager.dto.absence.AbsenceStatusUpdateRequest;
import com.example.time_manager.dto.absence.AbsenceUpdateRequest;
import com.example.time_manager.model.absence.AbsencePeriod;
import com.example.time_manager.model.absence.AbsenceStatus;
import com.example.time_manager.model.absence.AbsenceType;
import com.example.time_manager.service.AbsenceService;

import jakarta.annotation.Nullable;

@PreAuthorize("isAuthenticated()")
@Controller
public class AbsenceGraphqlController {

  private final AbsenceService absenceService;

  public AbsenceGraphqlController(AbsenceService absenceService) {
    this.absenceService = absenceService;
  }


  private String currentEmail() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new SecurityException("Unauthenticated");
    }
    Object principal = auth.getPrincipal();
    if (principal instanceof UserDetails u) {
      return u.getUsername();
    }
    return auth.getName();
  }

  private static Map<LocalDate, AbsencePeriod> toMap(List<PeriodByDateInput> periodList) {
    Map<LocalDate, AbsencePeriod> m = new HashMap<>();
    if (periodList != null) {
      for (PeriodByDateInput p : periodList) {
        m.put(LocalDate.parse(p.getDate()), p.getPeriod());
      }
    }
    return m;
  }

  /* ======================== Queries ====================== */

  @QueryMapping
  public List<AbsenceResponse> myAbsences() {
    return absenceService.listMine(currentEmail());
  }

  @QueryMapping
  public AbsenceResponse absence(@Argument Long id) {
    return absenceService.getVisibleTo(currentEmail(), id);
  }

  @QueryMapping
  public List<AbsenceResponse> absencesByUser(@Argument String userId) {
    return absenceService.listForUser(userId);
  }

  @QueryMapping
  public List<AbsenceResponse> allAbsences() {
    return absenceService.listAll();
  }

  @QueryMapping
  public List<AbsenceResponse> myTeamAbsences(@Argument @Nullable Long teamId) {
    return absenceService.listTeamAbsences(currentEmail(), teamId);
  }

  @QueryMapping
  public List<AbsenceResponse> teamAbsences(@Argument Long teamId) {
    return absenceService.listTeamAbsences(teamId);
  }

  /* ======================= Mutations ===================== */

  @MutationMapping
  public AbsenceResponse createAbsence(@Argument AbsenceCreateInput input) {
    AbsenceCreateRequest req = new AbsenceCreateRequest();
    req.setStartDate(LocalDate.parse(input.getStartDate()));
    req.setEndDate(LocalDate.parse(input.getEndDate()));
    req.setType(input.getType());
    req.setReason(input.getReason());
    req.setSupportingDocumentUrl(input.getSupportingDocumentUrl());
    req.setPeriodByDate(toMap(input.getPeriodByDate()));
    return absenceService.createForEmail(currentEmail(), req);
  }

  @MutationMapping
  public AbsenceResponse updateAbsence(@Argument Long id, @Argument AbsenceUpdateInput input) {
    AbsenceUpdateRequest req = new AbsenceUpdateRequest();
    if (input.getStartDate() != null) req.setStartDate(LocalDate.parse(input.getStartDate()));
    if (input.getEndDate() != null) req.setEndDate(LocalDate.parse(input.getEndDate()));
    req.setType(input.getType());
    req.setReason(input.getReason());
    req.setSupportingDocumentUrl(input.getSupportingDocumentUrl());
    req.setPeriodByDate(toMap(input.getPeriodByDate()));
    return absenceService.updateVisibleTo(currentEmail(), id, req);
  }

  @MutationMapping
  public AbsenceResponse setAbsenceStatus(@Argument Long id, @Argument AbsenceStatusUpdateInput input) {
    AbsenceStatusUpdateRequest req = new AbsenceStatusUpdateRequest();
    req.setStatus(input.getStatus());
    return absenceService.setStatus(currentEmail(), id, req);
  }

  @MutationMapping
  public Boolean deleteAbsence(@Argument Long id) {
    absenceService.deleteVisibleTo(currentEmail(), id);
    return true;
  }

  /* ========== Input ========== */

  public static class AbsenceCreateInput {
    private String startDate;                 // yyyy-MM-dd
    private String endDate;                   // yyyy-MM-dd
    private AbsenceType type;
    private String reason;
    private String supportingDocumentUrl;
    private List<PeriodByDateInput> periodByDate;

    public AbsenceCreateInput() {}

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public AbsenceType getType() { return type; }
    public void setType(AbsenceType type) { this.type = type; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getSupportingDocumentUrl() { return supportingDocumentUrl; }
    public void setSupportingDocumentUrl(String supportingDocumentUrl) { this.supportingDocumentUrl = supportingDocumentUrl; }

    public List<PeriodByDateInput> getPeriodByDate() { return periodByDate; }
    public void setPeriodByDate(List<PeriodByDateInput> periodByDate) { this.periodByDate = periodByDate; }
  }

  public static class AbsenceUpdateInput {
    private String startDate;                 // nullable
    private String endDate;                   // nullable
    private AbsenceType type;                 // nullable
    private String reason;                    // nullable
    private String supportingDocumentUrl;     // nullable
    private List<PeriodByDateInput> periodByDate; // nullable

    public AbsenceUpdateInput() {}

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public AbsenceType getType() { return type; }
    public void setType(AbsenceType type) { this.type = type; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getSupportingDocumentUrl() { return supportingDocumentUrl; }
    public void setSupportingDocumentUrl(String supportingDocumentUrl) { this.supportingDocumentUrl = supportingDocumentUrl; }

    public List<PeriodByDateInput> getPeriodByDate() { return periodByDate; }
    public void setPeriodByDate(List<PeriodByDateInput> periodByDate) { this.periodByDate = periodByDate; }
  }

  public static class AbsenceStatusUpdateInput {
    private AbsenceStatus status;

    public AbsenceStatusUpdateInput() {}

    public AbsenceStatus getStatus() { return status; }
    public void setStatus(AbsenceStatus status) { this.status = status; }
  }

  public static class PeriodByDateInput {
    private String date;          // yyyy-MM-dd
    private AbsencePeriod period; // AM/PM/FULL_DAY

    public PeriodByDateInput() {}

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public AbsencePeriod getPeriod() { return period; }
    public void setPeriod(AbsencePeriod period) { this.period = period; }
  }
}
