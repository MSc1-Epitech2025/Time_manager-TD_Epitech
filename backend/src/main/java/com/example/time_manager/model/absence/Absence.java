package com.example.time_manager.model.absence;

import java.time.Instant;
import java.time.LocalDate;

import com.example.time_manager.model.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "absence")
public class Absence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

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

    @ManyToOne
    @JoinColumn(name = "approved_by", referencedColumnName = "id")
    private User approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // getters/setters...
    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}

    public User getUser() {return user;}
    public void setUser(User user) {this.user = user;}

    public LocalDate getStartDate() {return startDate;}
    public void setStartDate(LocalDate startDate) {this.startDate = startDate;}

    public LocalDate getEndDate() {return endDate;}
    public void setEndDate(LocalDate endDate) {this.endDate = endDate;}

    public AbsenceType getType() {return type;}
    public void setType(AbsenceType type) {this.type = type;}

    public String getSupportingDocumentUrl() {return supportingDocumentUrl;}
    public void setSupportingDocumentUrl(String supportingDocumentUrl) {this.supportingDocumentUrl = supportingDocumentUrl;}

    public String getReason() {return reason;}
    public void setReason(String reason) {this.reason = reason;}

    public AbsenceStatus getStatus() {return status;}    
    public void setStatus(AbsenceStatus status) {this.status = status;}

    public User getApprovedBy() {return approvedBy;}
    public void setApprovedBy(User approvedBy) {this.approvedBy = approvedBy;}

    public Instant getApprovedAt() {return approvedAt;}
    public void setApprovedAt(Instant approvedAt) {this.approvedAt = approvedAt;}

    public Instant getCreatedAt() {return createdAt;}
    public void setCreatedAt(Instant createdAt) {this.createdAt = createdAt;}

    public Instant getUpdatedAt() {return updatedAt;}
    public void setUpdatedAt(Instant updatedAt) {this.updatedAt = updatedAt;}
    
}
