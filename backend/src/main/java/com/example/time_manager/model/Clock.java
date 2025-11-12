package com.example.time_manager.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "clocks")
public class Clock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, length = 3)
    private ClockKind kind;

    @Column(name = "at", nullable = false)
    private Instant at;

    // getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public ClockKind getKind() { return kind; }
    public void setKind(ClockKind kind) { this.kind = kind; }

    public Instant getAt() { return at; }
    public void setAt(Instant at) { this.at = at; }
}
