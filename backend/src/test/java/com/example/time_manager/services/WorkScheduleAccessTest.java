package com.example.time_manager.services;

import com.example.time_manager.model.User;
import com.example.time_manager.repository.TeamMemberRepository;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.security.WorkScheduleAccess;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WorkScheduleAccessTest {

    private UserRepository userRepo;
    private TeamMemberRepository teamMemberRepo;
    private WorkScheduleAccess access;

    private final String ADMIN_ID = "admin";
    private final String MANAGER_ID = "manager";
    private final String USER_ID = "user";
    private final String OTHER_USER = "other";

    @BeforeEach
    void setUp() {
        userRepo = mock(UserRepository.class);
        teamMemberRepo = mock(TeamMemberRepository.class);
        access = new WorkScheduleAccess(userRepo, teamMemberRepo);

        User admin = new User();
        admin.setId(ADMIN_ID);
        admin.setRole("ADMIN");

        User manager = new User();
        manager.setId(MANAGER_ID);
        manager.setRole("MANAGER");

        User user = new User();
        user.setId(USER_ID);
        user.setRole("EMPLOYEE");

        when(userRepo.findById(ADMIN_ID)).thenReturn(Optional.of(admin));
        when(userRepo.findById(MANAGER_ID)).thenReturn(Optional.of(manager));
        when(userRepo.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    @Test
    void testAssertCanSelfManage_AdminAllowed() {
        assertDoesNotThrow(() -> access.assertCanSelfManage(ADMIN_ID));
    }

    @Test
    void testAssertCanSelfManage_ManagerAllowed() {
        assertDoesNotThrow(() -> access.assertCanSelfManage(MANAGER_ID));
    }

    @Test
    void testAssertCanSelfManage_UserDenied() {
        assertThrows(AccessDeniedException.class, () -> access.assertCanSelfManage(USER_ID));
    }

    @Test
    void testAssertCanManage_AdminCanManageAnyone() {
        assertDoesNotThrow(() -> access.assertCanManage(ADMIN_ID, USER_ID));
    }

    @Test
    void testAssertCanManage_ManagerCanManageSelf() {
        assertDoesNotThrow(() -> access.assertCanManage(MANAGER_ID, MANAGER_ID));
    }

    @Test
    void testAssertCanManage_NullUser_Throws() {
        assertThrows(AccessDeniedException.class, () -> access.assertCanManage(null, USER_ID));
        assertThrows(AccessDeniedException.class, () -> access.assertCanManage(ADMIN_ID, null));
    }

    @Test
    void testAssertCanManage_ManagerSameTeam_CanManage() {
        when(teamMemberRepo.findTeamIdsByUserId(MANAGER_ID)).thenReturn(List.of(1L, 2L));
        when(teamMemberRepo.existsByTeam_IdAndUser_Id(1L, OTHER_USER)).thenReturn(true);

        User other = new User();
        other.setId(OTHER_USER);
        other.setRole("EMPLOYEE");
        when(userRepo.findById(OTHER_USER)).thenReturn(Optional.of(other));

        assertDoesNotThrow(() -> access.assertCanManage(MANAGER_ID, OTHER_USER));
    }

    @Test
    void testAssertCanManage_ManagerNotInSameTeam_Denied() {
        when(teamMemberRepo.findTeamIdsByUserId(MANAGER_ID)).thenReturn(List.of(1L, 2L));
        when(teamMemberRepo.existsByTeam_IdAndUser_Id(anyLong(), eq(OTHER_USER))).thenReturn(false);

        User other = new User();
        other.setId(OTHER_USER);
        other.setRole("EMPLOYEE");
        when(userRepo.findById(OTHER_USER)).thenReturn(Optional.of(other));

        assertThrows(AccessDeniedException.class, () -> access.assertCanManage(MANAGER_ID, OTHER_USER));
    }

    @Test
    void testAssertCanManage_NonManagerNonAdmin_Denied() {
        assertThrows(AccessDeniedException.class, () -> access.assertCanManage(USER_ID, OTHER_USER));
    }

    @Test
    void testAssertCanManage_ManagerNoTeams_Denied() {
        when(teamMemberRepo.findTeamIdsByUserId(MANAGER_ID)).thenReturn(List.of());
        User other = new User();
        other.setId(OTHER_USER);
        other.setRole("EMPLOYEE");
        when(userRepo.findById(OTHER_USER)).thenReturn(Optional.of(other));

        assertThrows(AccessDeniedException.class, () -> access.assertCanManage(MANAGER_ID, OTHER_USER));
    }

    @Test
    void testIsAdmin_ReturnsFalseWhenUserNotFound() {
        when(userRepo.findById("unknown")).thenReturn(Optional.empty());
        assertThrows(AccessDeniedException.class, () -> access.assertCanManage("unknown", USER_ID));
    }
}
