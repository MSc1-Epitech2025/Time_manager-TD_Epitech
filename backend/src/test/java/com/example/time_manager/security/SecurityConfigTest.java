package com.example.time_manager.security;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.DefaultSecurityFilterChain;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityConfigTest {

    private SecurityConfig securityConfig;

    @Mock
    private JwtAuthFilter jwtAuthFilter;

    @Mock
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @Mock
    private HttpSecurity http;

    @Mock
    private DefaultSecurityFilterChain defaultSecurityFilterChain;

    @Mock
    private AuthenticationConfiguration authenticationConfiguration;

    @Mock
    private AuthenticationManager authenticationManager;

    @BeforeEach
    void setUp() {
        securityConfig = new SecurityConfig();
        ReflectionTestUtils.setField(securityConfig, "frontendUrl", "http://localhost:4200");
    }

    @Test
    void securityFilterChain_shouldConfigureCorrectly() throws Exception {
        when(http.sessionManagement(any())).thenReturn(http);
        when(http.csrf(any())).thenReturn(http);
        when(http.cors(any())).thenReturn(http);
        when(http.authorizeHttpRequests(any())).thenReturn(http);
        when(http.oauth2Login(any())).thenReturn(http);
        when(http.formLogin(any())).thenReturn(http);
        when(http.httpBasic(any())).thenReturn(http);
        when(http.addFilterBefore(any(), any())).thenReturn(http);
        when(http.build()).thenReturn(defaultSecurityFilterChain);

        SecurityFilterChain result = securityConfig.securityFilterChain(http, jwtAuthFilter, oAuth2SuccessHandler);

        assertNotNull(result);
        verify(http).build();
    }

    @Test
    void corsConfigurationSource_shouldReturnValidConfiguration() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertNotNull(source);
    }

    @Test
    void corsConfigurationSource_shouldAllowCorrectOrigins() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();

        org.springframework.mock.web.MockHttpServletRequest request =
                new org.springframework.mock.web.MockHttpServletRequest();
        request.setRequestURI("/**");
        request.setServletPath("/**");

        CorsConfiguration config = source.getCorsConfiguration(request);

        if (config == null) {
            request.setRequestURI("/");
            request.setServletPath("/");
            config = source.getCorsConfiguration(request);
        }

        assertNotNull(config, "CorsConfiguration should not be null");
        assertNotNull(config.getAllowedMethods());
        assertTrue(config.getAllowCredentials());
    }
    @Test
    void passwordEncoder_shouldReturnBCryptEncoder() {
        PasswordEncoder encoder = securityConfig.passwordEncoder();
        assertNotNull(encoder);
        assertInstanceOf(BCryptPasswordEncoder.class, encoder);
    }

    @Test
    void authenticationManager_shouldReturnFromConfiguration() throws Exception {
        when(authenticationConfiguration.getAuthenticationManager()).thenReturn(authenticationManager);

        AuthenticationManager result = securityConfig.authenticationManager(authenticationConfiguration);

        assertNotNull(result);
        assertEquals(authenticationManager, result);
    }
}