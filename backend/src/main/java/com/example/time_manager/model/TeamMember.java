package com.example.time_manager.model;

import jakarta.persistence.*;

@Entity
@Table(name = "team_members",
       uniqueConstraints = @UniqueConstraint(columnNames = {"team_id","user_id"}))
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional=false)
    @JoinColumn(name="team_id", nullable=false)
    private Team team;

    @ManyToOne(optional=false)
    @JoinColumn(name="user_id", referencedColumnName = "id", nullable=false)
    private User user;

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
