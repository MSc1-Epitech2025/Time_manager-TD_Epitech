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
}
