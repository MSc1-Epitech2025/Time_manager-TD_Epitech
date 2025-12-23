package com.example.time_manager.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.io.IOException;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtAuthFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthFilter jwtAuthFilter;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.clearContext();
    }

    @Test
    void testNoCookies() throws ServletException, IOException {
        when(request.getCookies()).thenReturn(null);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void testCookieWithoutAccessToken() throws ServletException, IOException {
        Cookie[] cookies = { new Cookie("other_cookie", "value") };
        when(request.getCookies()).thenReturn(cookies);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void testInvalidTokenThrowsException() throws Exception {
        Cookie[] cookies = { new Cookie("access_token", "invalidToken") };
        when(request.getCookies()).thenReturn(cookies);
        when(jwtUtil.extractUsername("invalidToken")).thenThrow(new RuntimeException("bad token"));

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void testTokenValidButNotAccessValid() throws Exception {
        Cookie[] cookies = { new Cookie("access_token", "token") };
        when(request.getCookies()).thenReturn(cookies);
        when(jwtUtil.extractUsername("token")).thenReturn("user");
        when(jwtUtil.isAccessTokenValid("token", "user")).thenReturn(false);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void testTokenValidAndAuthenticated() throws Exception {
        Cookie[] cookies = { new Cookie("access_token", "token") };
        when(request.getCookies()).thenReturn(cookies);
        when(jwtUtil.extractUsername("token")).thenReturn("user");
        when(jwtUtil.isAccessTokenValid("token", "user")).thenReturn(true);

        UserDetails userDetails = new User("user", "pass", Collections.emptyList());
        when(userDetailsService.loadUserByUsername("user")).thenReturn(userDetails);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(SecurityContextHolder.getContext().getAuthentication() instanceof UsernamePasswordAuthenticationToken);
        assertEquals("user", ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername());
    }

    @Test
    void shouldNotFilter_oauth2Path() {
        when(request.getRequestURI()).thenReturn("/oauth2/authorize");

        boolean result = jwtAuthFilter.shouldNotFilter(request);

        assertTrue(result);
    }

    @Test
    void shouldNotFilter_loginOauth2Path() {
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/azure");

        boolean result = jwtAuthFilter.shouldNotFilter(request);

        assertTrue(result);
    }

    @Test
    void shouldNotFilter_oauth2SuccessExact() {
        when(request.getRequestURI()).thenReturn("/oauth2/success");

        boolean result = jwtAuthFilter.shouldNotFilter(request);

        assertTrue(result);
    }

    @Test
    void shouldNotFilter_actuatorPath() {
        when(request.getRequestURI()).thenReturn("/actuator/health");

        boolean result = jwtAuthFilter.shouldNotFilter(request);

        assertTrue(result);
    }

    @Test
    void shouldNotFilter_faviconPath() {
        when(request.getRequestURI()).thenReturn("/favicon.ico");

        boolean result = jwtAuthFilter.shouldNotFilter(request);

        assertTrue(result);
    }

    @Test
    void shouldNotFilter_resourcesPath() {
        when(request.getRequestURI()).thenReturn("/resources/static/main.js");

        boolean result = jwtAuthFilter.shouldNotFilter(request);

        assertTrue(result);
    }

    @Test
    void shouldFilter_graphqlPath() {
        when(request.getRequestURI()).thenReturn("/graphql");

        boolean result = jwtAuthFilter.shouldNotFilter(request);

        assertFalse(result);
    }

    @Test
    void shouldFilter_apiPath() {
        when(request.getRequestURI()).thenReturn("/api/users");

        boolean result = jwtAuthFilter.shouldNotFilter(request);

        assertFalse(result);
    }

    @Test
    void testTokenValidButAuthenticationAlreadySet() throws Exception {
        Cookie[] cookies = { new Cookie("access_token", "token") };
        when(request.getCookies()).thenReturn(cookies);
        when(jwtUtil.extractUsername("token")).thenReturn("user");

        UserDetails existingUser = new User("existingUser", "pass", Collections.emptyList());
        UsernamePasswordAuthenticationToken existingAuth =
                new UsernamePasswordAuthenticationToken(existingUser, null, existingUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals("existingUser",
                ((UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getUsername());
        verify(jwtUtil, never()).isAccessTokenValid(any(), any());
    }

    @Test
    void testUsernameNullSkipsAuthentication() throws Exception {
        Cookie[] cookies = {new Cookie("access_token", "token")};
        when(request.getCookies()).thenReturn(cookies);
        when(jwtUtil.extractUsername("token")).thenReturn(null);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(jwtUtil, never()).isAccessTokenValid(anyString(), anyString());
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }
}
