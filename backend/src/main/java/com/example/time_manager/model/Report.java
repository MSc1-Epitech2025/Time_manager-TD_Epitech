package com.example.time_manager.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "reports")
public class Report {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY) // id INT AUTO_INCREMENT
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "author_id", nullable = false)   // CHAR(36) FK -> users(id)
  private User author;

  @ManyToOne(optional = false)
  @JoinColumn(name = "target_user_id", nullable = false) // CHAR(36) FK -> users(id)
  private User target;

  @Column(nullable = false, length = 255)
  private String title;

  @Lob
  private String body;

  @Column(name = "created_at", nullable = false, updatable = false,
          columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
  private Instant createdAt;

  /* getters/setters */

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public User getAuthor() { return author; }
  public void setAuthor(User author) { this.author = author; }

  public User getTarget() { return target; }
  public void setTarget(User target) { this.target = target; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getBody() { return body; }
  public void setBody(String body) { this.body = body; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  
}
