package com.example.time_manager.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
  name = "reports",
  indexes = {
    @Index(name = "idx_reports_target_created", columnList = "target_user_id,created_at"),
    @Index(name = "idx_reports_subject_created", columnList = "subject_user_id,created_at"),
    @Index(name = "idx_reports_type_created", columnList = "type,created_at")
  }
)
public class Report {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "author_id", nullable = false)
  private User author;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "target_user_id", nullable = false)
  private User target;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "subject_user_id")
  private User subject;

  @Column(nullable = false, length = 64)
  private String type = "MANUAL";

  @Column(nullable = false, length = 16)
  private String severity = "INFO";

  @Column(name = "rule_key", length = 160, unique = true)
  private String ruleKey;

  @Column(nullable = false, length = 255)
  private String title;

  @Lob
  private String body;

  @Column(
    name = "created_at",
    nullable = false,
    updatable = false,
    columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
  )
  private Instant createdAt;

  @Column(
    name = "updated_at",
    insertable = false,
    updatable = false,
    columnDefinition = "TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP"
  )
  private Instant updatedAt;

  /* getters/setters */

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public User getAuthor() { return author; }
  public void setAuthor(User author) { this.author = author; }

  public User getTarget() { return target; }
  public void setTarget(User target) { this.target = target; }

  public User getSubject() { return subject; }
  public void setSubject(User subject) { this.subject = subject; }

  public String getType() { return type; }
  public void setType(String type) { this.type = type; }

  public String getSeverity() { return severity; }
  public void setSeverity(String severity) { this.severity = severity; }

  public String getRuleKey() { return ruleKey; }
  public void setRuleKey(String ruleKey) { this.ruleKey = ruleKey; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getBody() { return body; }
  public void setBody(String body) { this.body = body; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

  public Instant getUpdatedAt() { return updatedAt; }
}
