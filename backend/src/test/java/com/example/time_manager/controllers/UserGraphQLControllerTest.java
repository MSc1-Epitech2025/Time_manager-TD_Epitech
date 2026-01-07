package com.example.time_manager.controllers;

import com.example.time_manager.dto.auth.AuthResponse;
import com.example.time_manager.dto.auth.CreateUserInput;
import com.example.time_manager.dto.auth.UpdateUserInput;
import com.example.time_manager.graphql.controller.UserGraphQLController;
import com.example.time_manager.model.User;
import com.example.time_manager.security.JwtUtil;
import com.example.time_manager.service.UserService;
import com.example.time_manager.service.auth.PasswordResetService;


import jakarta.security.auth.message.AuthException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.junit.jupiter.api.*;
import org.mockito.*;
import org.springframework.mock.web.*;
import org.springframework.web.context.request.*;

import java.lang.reflect.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class UserGraphQLControllerTest {

    @Mock private UserService userService;
    @Mock private JwtUtil jwtUtil;
    @Mock private PasswordResetService passwordResetService;

    private UserGraphQLController controller;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        controller = new UserGraphQLController(userService, jwtUtil, passwordResetService);
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));
    }

    @Test
    void testRegister_NewUser() throws Exception {
        CreateUserInput input = new CreateUserInput(
                "John", "Doe", "john@example.com",
                "0606060606", "ADMIN", "Dev", null, "pass123"
        );

        when(userService.findByEmail("john@example.com")).thenReturn(Optional.empty());
        User saved = new User();
        saved.setEmail("john@example.com");
        when(userService.saveUser(any(User.class))).thenReturn(saved);

        User result = controller.register(input);

        assertEquals("john@example.com", result.getEmail());
        verify(userService).saveUser(any(User.class));
        verify(passwordResetService)
        .sendSetPasswordEmailFor(eq(saved), anyString());

    }

    @Test
    void testRegister_EmailExists_Throws() {
        CreateUserInput input = new CreateUserInput(
                "John", "Doe", "john@example.com",
                "0606060606", "ADMIN", "Dev", null, "pass123"
        );

        when(userService.findByEmail("john@example.com"))
                .thenReturn(Optional.of(new User()));

        AuthException ex = assertThrows(AuthException.class,
                () -> controller.register(input));

        assertTrue(ex.getMessage().contains("Email already exists"));
        verify(passwordResetService, never())
        .sendSetPasswordEmailFor(any(), anyString());

    }

    @Test
    void testDeleteUser() {
        assertTrue(controller.deleteUser("ID1"));
        verify(userService).deleteById("ID1");
    }

    @Test
    void testRefresh_Success() throws Exception {
        request.setCookies(new Cookie("refresh_token", "TOK123"));

        User u = new User();
        u.setEmail("john@test.com");
        u.setId("ID1");
        u.setFirstName("John");
        u.setRole("ADMIN");

        when(jwtUtil.parseRefreshSubject("TOK123")).thenReturn("john@test.com");
        when(jwtUtil.isRefreshTokenValid("TOK123", "john@test.com")).thenReturn(true);
        when(userService.findByEmail("john@test.com")).thenReturn(Optional.of(u));
        when(jwtUtil.generateAccessToken(any(), any(), any(), any())).thenReturn("NEW_ACCESS");

        AuthResponse r = controller.refresh();

        assertTrue(r.ok);
        assertNotNull(response.getHeader("Set-Cookie"));
    }

    @Test
    void testRefresh_MissingToken_Throws() {
        AuthException ex = assertThrows(AuthException.class,
                () -> controller.refresh());

        assertEquals("Missing refresh token", ex.getMessage());
    }

    @Test
    void testRefresh_ParseError_Throws() {
        request.setCookies(new Cookie("refresh_token", "ERR"));

        when(jwtUtil.parseRefreshSubject("ERR"))
                .thenThrow(new RuntimeException("parse!"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> controller.refresh());
        assertEquals("parse!", ex.getMessage());
    }

    @Test
    void testRefresh_InvalidToken_Throws() {
        request.setCookies(new Cookie("refresh_token", "OLD"));

        when(jwtUtil.parseRefreshSubject("OLD")).thenReturn("john@test.com");
        when(jwtUtil.isRefreshTokenValid("OLD", "john@test.com")).thenReturn(false);

        AuthException ex = assertThrows(AuthException.class,
                () -> controller.refresh());

        assertEquals("Invalid or expired refresh token", ex.getMessage());
    }

    @Test
    void testRefresh_UserNotFound_Throws() {
        request.setCookies(new Cookie("refresh_token", "TOK"));

        when(jwtUtil.parseRefreshSubject("TOK")).thenReturn("unknown@test.com");
        when(jwtUtil.isRefreshTokenValid("TOK", "unknown@test.com")).thenReturn(true);
        when(userService.findByEmail("unknown@test.com"))
                .thenReturn(Optional.empty());

        AuthException ex = assertThrows(AuthException.class,
                () -> controller.refresh());

        assertEquals("User not found", ex.getMessage());
    }

    @Test
    void testRefresh_BlankToken_Throws() {
        request.setCookies(new Cookie("refresh_token", " "));

        AuthException ex = assertThrows(AuthException.class,
                () -> controller.refresh());

        assertEquals("Missing refresh token", ex.getMessage());
    }

    @Test
    void testUpdateUser() {
        UpdateUserInput input = new UpdateUserInput(
                "42", "John", "Doe", "john@test.com",
                null, null, null, null, null);

        User u = new User();
        u.setId("42");

        when(userService.updateUser(eq("42"), any())).thenReturn(u);

        User result = controller.updateUser(input);
        assertEquals("42", result.getId());
    }

    @Test
    void testLogout() {
        assertTrue(controller.logout());
        List<String> cookies = response.getHeaders("Set-Cookie");
        assertEquals(4, cookies.size());
    }

    @Test
    void testUsers_NotEmpty() {
        when(userService.findAllUsers()).thenReturn(List.of(new User(), new User()));
        assertEquals(2, controller.users().size());
    }

    @Test
    void testUsers_Null_ReturnsEmpty() {
        when(userService.findAllUsers()).thenReturn(null);
        assertTrue(controller.users().isEmpty());
    }

    @Test
    void testUserByEmail_Found() {
        User u = new User();
        u.setEmail("john@test.com");

        when(userService.findByEmail("john@test.com"))
                .thenReturn(Optional.of(u));

        assertNotNull(controller.userByEmail("john@test.com"));
    }

    @Test
    void testUserByEmail_NotFound() {
        when(userService.findByEmail("xx")).thenReturn(Optional.empty());
        assertNull(controller.userByEmail("xx"));
    }

    @Test
    void testCurrentResponse_NoResponse() throws Exception {
        MockHttpServletRequest req2 = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req2, null));

        Method m = UserGraphQLController.class.getDeclaredMethod("currentResponse");
        m.setAccessible(true);

        InvocationTargetException ex = assertThrows(
                InvocationTargetException.class,
                () -> m.invoke(null)
        );

        assertTrue(ex.getCause() instanceof IllegalStateException);
    }

    @Test
    void testReadCookie_Found() throws Exception {
        request.setCookies(new Cookie("refresh_token", "XYZ"));

        Method m = UserGraphQLController.class.getDeclaredMethod(
                "readCookie", HttpServletRequest.class, String.class
        );
        m.setAccessible(true);

        assertEquals("XYZ", m.invoke(null, request, "refresh_token"));
    }

    @Test
    void testReadCookie_NotFound() throws Exception {
        Method m = UserGraphQLController.class.getDeclaredMethod(
                "readCookie", HttpServletRequest.class, String.class
        );
        m.setAccessible(true);

        assertNull(m.invoke(null, request, "refresh_token"));
    }

    @Test
    void testReadCookie_CookiesExistButNoMatch() throws Exception {
        request.setCookies(
                new Cookie("other", "123"),
                new Cookie("another", "456")
        );

        Method m = UserGraphQLController.class.getDeclaredMethod(
                "readCookie", HttpServletRequest.class, String.class
        );
        m.setAccessible(true);

        assertNull(m.invoke(null, request, "refresh_token"));
    }

    @Test
    void testAddAccessCookie() throws Exception {
        Method m = UserGraphQLController.class.getDeclaredMethod(
                "addAccessCookie", HttpServletResponse.class, String.class
        );
        m.setAccessible(true);

        m.invoke(null, response, "TOKEN123");

        String header = response.getHeader("Set-Cookie");
        assertNotNull(header);
        assertTrue(header.contains("access_token=TOKEN123"));
        assertTrue(header.contains("HttpOnly"));
    }

    @Test
    void testExpireCookie() throws Exception {
        Method m = UserGraphQLController.class.getDeclaredMethod(
                "expireCookie", HttpServletResponse.class, String.class, String.class
        );
        m.setAccessible(true);

        m.invoke(null, response, "abc", "/x");

        String header = response.getHeader("Set-Cookie");
        assertTrue(header.contains("abc="));
        assertTrue(header.contains("Max-Age=0"));
    }

    @Test
    void testAddRefreshCookie() throws Exception {
        Method m = UserGraphQLController.class.getDeclaredMethod(
                "addRefreshCookie", HttpServletResponse.class, String.class
        );
        m.setAccessible(true);

        m.invoke(null, response, "REFRESH123");

        String header = response.getHeader("Set-Cookie");
        assertNotNull(header);
        assertTrue(header.contains("refresh_token=REFRESH123"));
        assertTrue(header.contains("HttpOnly"));
        assertTrue(header.contains("Path=/graphql"));
    }

    @Test
    void testLogin_Success() {
        com.example.time_manager.dto.auth.AuthRequest req =
                new com.example.time_manager.dto.auth.AuthRequest("john@test.com", "pwd");

        User u = new User();
        u.setEmail("john@test.com");
        u.setId("ID1");
        u.setFirstName("John");
        u.setRole("ADMIN");

        when(userService.validateUser("john@test.com", "pwd")).thenReturn(true);
        when(userService.findByEmail("john@test.com")).thenReturn(Optional.of(u));
        when(jwtUtil.generateAccessToken(any(), any(), any(), any()))
                .thenReturn("ACCESS123");
        when(jwtUtil.generateRefreshToken("john@test.com", "ID1"))
                .thenReturn("REFRESH123");

        AuthResponse resp = controller.login(req);

        assertTrue(resp.ok);
        List<String> cookies = response.getHeaders("Set-Cookie");

        assertEquals(2, cookies.size());
        assertTrue(cookies.get(0).contains("access_token=ACCESS123")
                || cookies.get(1).contains("access_token=ACCESS123"));
        assertTrue(cookies.get(0).contains("refresh_token=REFRESH123")
                || cookies.get(1).contains("refresh_token=REFRESH123"));
    }

    @Test
    void testLogin_InvalidCredentials_Throws() {
        com.example.time_manager.dto.auth.AuthRequest req =
                new com.example.time_manager.dto.auth.AuthRequest("john@test.com", "wrong");

        when(userService.validateUser("john@test.com", "wrong")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> controller.login(req));

        assertEquals("Invalid credentials", ex.getMessage());
    }

    @Test
    void testRequestPasswordReset_Success() {
        com.example.time_manager.dto.auth.ResetPasswordRequestInput input =
                new com.example.time_manager.dto.auth.ResetPasswordRequestInput("john@test.com");

        AuthResponse resp = controller.requestPasswordReset(input);

        assertTrue(resp.ok);
        verify(passwordResetService).requestResetByEmail("john@test.com");
    }

    @Test
    void testRequestPasswordResetWithTemp_Success() {
        com.example.time_manager.dto.auth.ResetPasswordRequestInput input =
                new com.example.time_manager.dto.auth.ResetPasswordRequestInput("john@test.com");

        AuthResponse resp = controller.requestPasswordResetWithTemp(input);

        assertTrue(resp.ok);
        verify(passwordResetService).requestResetWithTempPassword("john@test.com");
    }

    @Test
    void testRequestPasswordResetWithTemp_ThrowsIllegalArgument() {
        com.example.time_manager.dto.auth.ResetPasswordRequestInput input =
                new com.example.time_manager.dto.auth.ResetPasswordRequestInput("unknown@test.com");

        doThrow(new IllegalArgumentException("User not found"))
                .when(passwordResetService).requestResetWithTempPassword("unknown@test.com");

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> controller.requestPasswordResetWithTemp(input));

        assertEquals("User not found", ex.getMessage());
    }

    @Test
    void testResetPassword_Success() {
        com.example.time_manager.dto.auth.ResetPasswordInput input =
                new com.example.time_manager.dto.auth.ResetPasswordInput("TOKEN123", "newPassword");

        AuthResponse resp = controller.resetPassword(input);

        assertTrue(resp.ok);
        verify(passwordResetService).resetPassword("TOKEN123", "newPassword");
    }

    @Test
    void testChangeMyPassword_Success() {
        com.example.time_manager.dto.auth.ChangePasswordInput input =
                new com.example.time_manager.dto.auth.ChangePasswordInput("oldPwd", "newPwd");

        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("john@test.com");

        org.springframework.security.core.context.SecurityContext securityContext =
                mock(org.springframework.security.core.context.SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);

        try (MockedStatic<org.springframework.security.core.context.SecurityContextHolder> holder =
                     mockStatic(org.springframework.security.core.context.SecurityContextHolder.class)) {

            holder.when(org.springframework.security.core.context.SecurityContextHolder::getContext)
                    .thenReturn(securityContext);

            User u = new User();
            u.setId("ID1");
            when(userService.findByEmail("john@test.com")).thenReturn(Optional.of(u));

            AuthResponse resp = controller.changeMyPassword(input);

            assertTrue(resp.ok);
            verify(userService).changePassword("john@test.com", "oldPwd", "newPwd");
            verify(userService).completeFirstLogin("ID1");
        }
    }

    @Test
    void testChangeMyPassword_UserNotPresent_NoCompleteFirstLogin() {
        com.example.time_manager.dto.auth.ChangePasswordInput input =
                new com.example.time_manager.dto.auth.ChangePasswordInput("oldPwd", "newPwd");

        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("john@test.com");

        org.springframework.security.core.context.SecurityContext securityContext =
                mock(org.springframework.security.core.context.SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);

        try (MockedStatic<org.springframework.security.core.context.SecurityContextHolder> holder =
                     mockStatic(org.springframework.security.core.context.SecurityContextHolder.class)) {

            holder.when(org.springframework.security.core.context.SecurityContextHolder::getContext)
                    .thenReturn(securityContext);

            when(userService.findByEmail("john@test.com")).thenReturn(Optional.empty());

            AuthResponse resp = controller.changeMyPassword(input);

            assertTrue(resp.ok);
            verify(userService).changePassword("john@test.com", "oldPwd", "newPwd");
            verify(userService, never()).completeFirstLogin(any());
        }
    }
}
