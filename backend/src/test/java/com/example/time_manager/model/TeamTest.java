package com.example.time_manager.model;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class TeamTest {

    @Test
    void testGettersAndSetters() {
        Team team = new Team();

        Long id = 10L;
        String name = "Développement";
        String description = "Équipe backend et frontend";
        Set<TeamMember> members = new HashSet<>();

        TeamMember member1 = new TeamMember();
        TeamMember member2 = new TeamMember();
        members.add(member1);
        members.add(member2);

        team.setId(id);
        team.setName(name);
        team.setDescription(description);
        team.setMembers(members);

        assertEquals(id, team.getId());
        assertEquals(name, team.getName());
        assertEquals(description, team.getDescription());
        assertEquals(2, team.getMembers().size());
        assertTrue(team.getMembers().contains(member1));
        assertTrue(team.getMembers().contains(member2));
    }

    @Test
    void testDefaultConstructorAndEmptyMembers() {
        Team team = new Team();

        assertNull(team.getId());
        assertNull(team.getName());
        assertNull(team.getDescription());
        assertNotNull(team.getMembers());
        assertTrue(team.getMembers().isEmpty());
    }

    @Test
    void testSetMembersReplacesExistingOnes() {
        Team team = new Team();

        Set<TeamMember> firstSet = new HashSet<>();
        TeamMember m1 = new TeamMember();
        firstSet.add(m1);
        team.setMembers(firstSet);

        assertEquals(1, team.getMembers().size());
        assertTrue(team.getMembers().contains(m1));

        Set<TeamMember> newSet = new HashSet<>();
        TeamMember m2 = new TeamMember();
        newSet.add(m2);
        team.setMembers(newSet);

        assertEquals(1, team.getMembers().size());
        assertFalse(team.getMembers().contains(m1));
        assertTrue(team.getMembers().contains(m2));
    }
}
