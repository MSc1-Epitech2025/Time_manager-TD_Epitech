package com.example.time_manager.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TeamMemberTest {

    @Test
    void testGettersAndSetters() {
        TeamMember member = new TeamMember();

        Team team = new Team();
        team.setId(10L);
        team.setName("Dev Team");

        User user = new User();
        user.setId("u123");
        user.setEmail("test@example.com");
        user.setRole("ADMIN");

        member.setId(1L);
        member.setTeam(team);
        member.setUser(user);

        assertEquals(1L, member.getId());
        assertEquals(team, member.getTeam());
        assertEquals(user, member.getUser());

        assertEquals("Dev Team", member.getTeam().getName());
        assertEquals("u123", member.getUser().getId());
        assertEquals("ADMIN", member.getUser().getRole());
    }

    @Test
    void testDefaultConstructorAndNullSafety() {
        TeamMember member = new TeamMember();
        assertNull(member.getId());
        assertNull(member.getTeam());
        assertNull(member.getUser());
    }
}
