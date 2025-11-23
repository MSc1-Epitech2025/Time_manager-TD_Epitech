package com.example.time_manager.controllers;

import com.example.time_manager.dto.auth.*;
import com.example.time_manager.graphql.controller.UserGraphQLController;
import com.example.time_manager.model.User;
import com.example.time_manager.security.JwtUtil;
import com.example.time_manager.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.*;
import org.mockito.*;
import org.springframework.mock.web.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.lang.reflect.InvocationTargetException;
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
        CreateUserInput input = new CreateUserInput("John", "Doe", "john@example.com",
                "0606060606", "ADMIN", "Dev", null, "pass123");

        when(userService.findByEmail("john@example.com")).thenReturn(Optional.empty());
        User u = new User(); u.setEmail("john@example.com");
        when(userService.saveUser(any(User.class))).thenReturn(u);

        User result = controller.register(input);

        assertEquals("john@example.com", result.getEmail());
        verify(userService).saveUser(any(User.class));
    }

    @Test
    void testRegister_EmailExists_ThrowsException() {
        CreateUserInput input = new CreateUserInput("John", "Doe", "john@example.com",
                "0606060606", "ADMIN", "Dev", null, "pass123");

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
        user.setEmail("john@example.com");
        user.setId("1");
        user.setFirstName("John");
        user.setRole("ADMIN");

        when(userService.validateUser("john@example.com", "pass123")).thenReturn(true);
        when(userService.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateAccessToken(any(), any(), any(), any())).thenReturn("access123");
        when(jwtUtil.generateRefreshToken(any(), any())).thenReturn("refresh123");

        AuthResponse res = controller.login(auth);

        assertTrue(res.isOk());
        assertTrue(response.getHeader("Set-Cookie").contains("access_token"));
    }

    @Test
    void testLogin_InvalidCredentials() {
        AuthRequest auth = new AuthRequest("john@example.com", "wrong");
        when(userService.validateUser("john@example.com", "wrong")).thenReturn(false);

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> controller.login(auth));
        assertEquals("Invalid credentials", thrown.getMessage());
    }

    @Test
    void testRefresh_WithCookieToken_Success() {
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
    }

    @Test
    void testRefresh_MissingToken_Throws() {
        assertThrows(RuntimeException.class, () -> controller.refresh(Optional.empty()));
    }

    @Test
    void testRefresh_BlankTokenInCookie_Throws() {
        request.setCookies(new Cookie("refresh_token", ""));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> controller.refresh(Optional.empty()));

        assertEquals("Missing refresh token", ex.getMessage());
    }

    @Test
    void testRefresh_BlankTokenInBody_FallbackToCookie() {
        RefreshRequest refreshReq = new RefreshRequest("");
        request.setCookies(new Cookie("refresh_token", "cookieToken456"));

        User user = new User();
        user.setEmail("john@example.com");
        user.setId("1");
        user.setFirstName("John");
        user.setRole("ADMIN");

        when(jwtUtil.parseRefreshSubject("cookieToken456")).thenReturn("john@example.com");
        when(jwtUtil.isRefreshTokenValid("cookieToken456", "john@example.com")).thenReturn(true);
        when(userService.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateAccessToken(any(), any(), any(), any())).thenReturn("access999");

        AuthResponse res = controller.refresh(Optional.of(refreshReq));
        assertTrue(res.isOk());
    }

    @Test
    void testRefresh_NullTokenInBody_FallbackToCookie() {
        RefreshRequest refreshReq = new RefreshRequest(null);
        request.setCookies(new Cookie("refresh_token", "cookieToken789"));

        User user = new User();
        user.setEmail("john@example.com");
        user.setId("1");
        user.setFirstName("John");
        user.setRole("ADMIN");

        when(jwtUtil.parseRefreshSubject("cookieToken789")).thenReturn("john@example.com");
        when(jwtUtil.isRefreshTokenValid("cookieToken789", "john@example.com")).thenReturn(true);
        when(userService.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(jwtUtil.generateAccessToken(any(), any(), any(), any())).thenReturn("access111");

        AuthResponse res = controller.refresh(Optional.of(refreshReq));
        assertTrue(res.isOk());
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
    void testUsers_ReturnsEmptyListWhenNull() {
        when(userService.findAllUsers()).thenReturn(null);
        assertTrue(controller.users().isEmpty());
    }

    @Test
    void testUserByEmail_Found() {
        User u = new User();
        u.setEmail("john@example.com");

        when(userService.findByEmail("john@example.com")).thenReturn(Optional.of(u));
        assertNotNull(controller.userByEmail("john@example.com"));
    }

    @Test
    void testUserByEmail_NotFound() {
        when(userService.findByEmail("x")).thenReturn(Optional.empty());
        assertNull(controller.userByEmail("x"));
    }

    @Test
    void testUpdateUser_CallsService() {
        UpdateUserInput input = new UpdateUserInput("42","John","Doe","john@test.com",
                null,null,null,null,null);

        User u = new User(); u.setId("42");
        when(userService.updateUser(eq("42"), any())).thenReturn(u);

        assertEquals("42", controller.updateUser(input).getId());
    }

    @Test
    void testRefresh_InvalidToken_ParseError() {
        request.setCookies(new Cookie("refresh_token", "bad"));
        when(jwtUtil.parseRefreshSubject("bad")).thenThrow(new RuntimeException());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> controller.refresh(Optional.empty()));

        assertEquals("Invalid refresh token", ex.getMessage());
    }

    @Test
    void testRefresh_InvalidOrExpiredToken() {
        request.setCookies(new Cookie("refresh_token", "tok999"));
        when(jwtUtil.parseRefreshSubject("tok999")).thenReturn("john@test.com");
        when(jwtUtil.isRefreshTokenValid("tok999", "john@test.com")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> controller.refresh(Optional.empty()));

        assertEquals("Invalid or expired refresh token", ex.getMessage());
    }

    @Test
    void testCurrentResponse_NoResponse_Throws() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req, null));

        Method m = UserGraphQLController.class.getDeclaredMethod("currentResponse");
        m.setAccessible(true);

        InvocationTargetException ex = assertThrows(InvocationTargetException.class,
                () -> m.invoke(null));

        assertTrue(ex.getCause() instanceof IllegalStateException);
    }

    @Test
    void testReadCookie_FindsCookie() throws Exception {
        request.setCookies(new Cookie("refresh_token", "XYZ"));

        Method m = UserGraphQLController.class.getDeclaredMethod(
                "readCookie", HttpServletRequest.class, String.class
        );
        m.setAccessible(true);

        assertEquals("XYZ", m.invoke(null, request, "refresh_token"));
    }

    @Test
    void testReadCookie_NoCookies_ReturnsNull() throws Exception {
        Method m = UserGraphQLController.class.getDeclaredMethod(
                "readCookie", HttpServletRequest.class, String.class
        );
        m.setAccessible(true);

        assertNull(m.invoke(null, request, "refresh_token"));
    }

    @Test
    void testReadCookie_CookieNotFound_ReturnsNull() throws Exception {
        request.setCookies(
                new Cookie("other_cookie", "value1"),
                new Cookie("another_cookie", "value2")
        );

        Method m = UserGraphQLController.class.getDeclaredMethod(
                "readCookie", HttpServletRequest.class, String.class
        );
        m.setAccessible(true);

        assertNull(m.invoke(null, request, "refresh_token"));
    }

    static class BeanNull {
        public String getSomething() { return null; }
    }

    @Test
    void testTryCallGetter_MethodExistsButReturnsNull() throws Exception {
        BeanNull bean = new BeanNull();

        Method m = UserGraphQLController.class.getDeclaredMethod(
                "tryCallGetter", Object.class, String.class
        );
        m.setAccessible(true);

        assertNull(m.invoke(null, bean, "getSomething"));
    }

    @Test
    void testTryCallGetter_InvalidMethod() throws Exception {
        RefreshRequest req = new RefreshRequest("X");

        Method m = UserGraphQLController.class.getDeclaredMethod(
                "tryCallGetter", Object.class, String.class
        );
        m.setAccessible(true);

        assertNull(m.invoke(null, req, "doesNotExist"));
    }

    @Test
    void testTryCallGetter_ValidMethod_ReturnsValue() throws Exception {
        RefreshRequest req = new RefreshRequest("TTT");

        Method m = UserGraphQLController.class.getDeclaredMethod(
                "tryCallGetter", Object.class, String.class
        );
        m.setAccessible(true);

        Object v = m.invoke(null, req, "refreshToken");

        assertEquals("TTT", v);
    }

    @Test
    void testExtractRefreshFromBody_ReturnsNull_WhenNoGetterMatches() throws Exception {
        RefreshRequest req = new RefreshRequest("AAA");

        Method m = UserGraphQLController.class.getDeclaredMethod(
                "extractRefreshFromBody", RefreshRequest.class
        );
        m.setAccessible(true);

        Object result = m.invoke(null, req);

        assertNull(result);
    }
}