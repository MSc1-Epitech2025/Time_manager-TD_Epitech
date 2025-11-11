package com.example.time_manager.controller;

import com.example.time_manager.dto.auth.*;
import com.example.time_manager.graphql.controller.UserGraphQLController;
import com.example.time_manager.model.User;
import com.example.time_manager.security.JwtUtil;
import com.example.time_manager.service.UserService;
import org.junit.jupiter.api.*;
import org.mockito.*;
import jakarta.servlet.http.Cookie;
import org.springframework.mock.web.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserGraphQLControllerTest {

    @Mock private UserService userService;
    @Mock private JwtUtil jwtUtil;

    private UserGraphQLController controller;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        controller = new UserGraphQLController(userService, jwtUtil);
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));
    }

    @Test
    void testRegister_NewUser() {
        CreateUserInput input = new CreateUserInput("John", "Doe", "john@example.com", "0606060606", "ADMIN", "Dev", null, "pass123");
        when(userService.findByEmail("john@example.com")).thenReturn(Optional.empty());
        User u = new User(); u.setEmail("john@example.com");
        when(userService.saveUser(any(User.class))).thenReturn(u);

        User result = controller.register(input);

        assertEquals("john@example.com", result.getEmail());
        verify(userService).saveUser(any(User.class));
    }

    @Test
    void testRegister_EmailExists_ThrowsException() {
        CreateUserInput input = new CreateUserInput("John", "Doe", "john@example.com", "0606060606", "ADMIN", "Dev", null, "pass123");
        when(userService.findByEmail("john@example.com")).thenReturn(Optional.of(new User()));

        assertThrows(RuntimeException.class, () -> controller.register(input));
    }

    @Test
    void testDeleteUser() {
        assertTrue(controller.deleteUser("1"));
        verify(userService).deleteById("1");
    }

    @Test
    void testLogin_Success() {
        AuthRequest auth = new AuthRequest("john@example.com", "pass123");
        User user = new User();
        user.setEmail("john@example.com"); user.setId("1"); user.setFirstName("John"); user.setRole("ADMIN");

        when(userService.validateUser("john@example.com", "pass123")).thenReturn(true);
        when(userService.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateAccessToken(any(), any(), any(), any())).thenReturn("access123");
        when(jwtUtil.generateRefreshToken(any(), any())).thenReturn("refresh123");

        AuthResponse res = controller.login(auth);

        assertTrue(res.isOk());
        assertTrue(response.getHeader("Set-Cookie").contains("access_token"));
        verify(jwtUtil).generateAccessToken(any(), any(), any(), any());
    }

    @Test
    void testLogin_InvalidCredentials() {
        AuthRequest auth = new AuthRequest("john@example.com", "wrong");
        when(userService.validateUser("john@example.com", "wrong")).thenReturn(false);

        RuntimeException thrown = assertThrows(
                RuntimeException.class,
                () -> controller.login(auth)
        );

        assertEquals("Invalid credentials", thrown.getMessage());
        verify(userService).validateUser("john@example.com", "wrong");
    }

    @Test
    void testRefresh_WithBodyToken_Success() {
        request.setCookies(new Cookie("refresh_token", "token123"));

        User user = new User();
        user.setEmail("john@example.com");
        user.setId("1");
        user.setFirstName("John");
        user.setRole("ADMIN");

        when(jwtUtil.parseRefreshSubject("token123")).thenReturn("john@example.com");
        when(jwtUtil.isRefreshTokenValid("token123", "john@example.com")).thenReturn(true);
        when(userService.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateAccessToken(any(), any(), any(), any())).thenReturn("access456");

        AuthResponse res = controller.refresh(Optional.empty());

        assertTrue(res.isOk());
        assertTrue(response.getHeader("Set-Cookie").contains("access_token"));
    }

    @Test
    void testRefresh_MissingToken_Throws() {
        assertThrows(RuntimeException.class, () -> controller.refresh(Optional.empty()));
    }

    @Test
    void testLogout_ShouldExpireCookies() {
        assertTrue(controller.logout());
        String header = response.getHeader("Set-Cookie");
        assertNotNull(header);
        assertTrue(header.contains("access_token"));
    }

    @Test
    void testUsers_ReturnsList() {
        List<User> users = List.of(new User(), new User());
        when(userService.findAllUsers()).thenReturn(users);

        List<User> result = controller.users();

        assertEquals(2, result.size());
    }

    @Test
    void testUserByEmail_Found() {
        User u = new User(); u.setEmail("john@example.com");
        when(userService.findByEmail("john@example.com")).thenReturn(Optional.of(u));

        User result = controller.userByEmail("john@example.com");
        assertNotNull(result);
    }

    @Test
    void testUserByEmail_NotFound() {
        when(userService.findByEmail("notfound@example.com")).thenReturn(Optional.empty());
        assertNull(controller.userByEmail("notfound@example.com"));
    }
}
