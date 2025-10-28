package com.example.time_manager.dto.team;

public record TeamMembersGroup(Long teamId, String teamName, java.util.List<com.example.time_manager.model.User> members) {}
