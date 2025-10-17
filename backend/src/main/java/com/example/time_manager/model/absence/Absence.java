package com.example.time_manager.model.absence;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

// Absence.java
@Entity @Table(name = "absence")
public class Absence {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false, length = 36)
  private String userId;

  @Column(name = "start_date", nullable = false)
  private LocalDate startDate;

  @Column(name = "end_date", nullable = false)
  private LocalDate endDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AbsenceType type;

  @Column(columnDefinition = "TEXT")
  private String reason;

  @Column(name = "supporting_document_url", length = 500)
  private String supportingDocumentUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AbsenceStatus status = AbsenceStatus.PENDING;

  @Column(name = "approved_by", length = 36)
  private String approvedBy;

  @Column(name = "approved_at")
  private LocalDateTime approvedAt;

  @Column(name = "created_at", updatable = false, insertable = false)
  private Timestamp createdAt;

  @Column(name = "updated_at", insertable = false)
  private Timestamp updatedAt;

  @OneToMany(mappedBy = "absence", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
  private List<AbsenceDay> days = new ArrayList<>();

    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}
    
    public String getUserId() {return userId;}
    public void setUserId(String userId) {this.userId = userId;}

    public LocalDate getStartDate() {return startDate;}
    public void setStartDate(LocalDate startDate) {this.startDate = startDate;}

    public LocalDate getEndDate() {return endDate;}
    public void setEndDate(LocalDate endDate) {this.endDate = endDate;}
    
    public AbsenceType getType() {return type;}
    public void setType(AbsenceType type) {this.type = type;}

    public String getReason() {return reason;} 
    public void setReason(String reason) {this.reason = reason;}

    public String getSupportingDocumentUrl() {return supportingDocumentUrl;}
    public void setSupportingDocumentUrl(String supportingDocumentUrl) {this.supportingDocumentUrl = supportingDocumentUrl;}

    public AbsenceStatus getStatus() {return status;}
    public void setStatus(AbsenceStatus status) {this.status = status;}

    public String getApprovedBy() {return approvedBy;}
    public void setApprovedBy(String approvedBy) {this.approvedBy = approvedBy;}

    public LocalDateTime getApprovedAt() {return approvedAt;}
    public void setApprovedAt(LocalDateTime approvedAt) {this.approvedAt = approvedAt;}

    public Timestamp getCreatedAt() {return createdAt;}
    public Timestamp getUpdatedAt() {return updatedAt;} 

    public List<AbsenceDay> getDays() {return days;}
    public void setDays(List<AbsenceDay> days) {this.days = days;}
    
}

