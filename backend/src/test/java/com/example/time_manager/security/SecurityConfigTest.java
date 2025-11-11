package com.example.time_manager.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.DefaultSecurityFilterChain;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SecurityConfigTest {

    private JwtAuthFilter jwtAuthFilter;
    private SecurityConfig securityConfig;

    @BeforeEach
    void setUp() {
        jwtAuthFilter = mock(JwtAuthFilter.class);
        securityConfig = new SecurityConfig(jwtAuthFilter);
    }

    @Test
    void testCorsConfigurationSourceContainsExpectedSettings() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertNotNull(source);

        UrlBasedCorsConfigurationSource urlSource = (UrlBasedCorsConfigurationSource) source;
        var configs = urlSource.getCorsConfigurations();
        assertTrue(configs.containsKey("/**"));

        CorsConfiguration cfg = configs.get("/**");
        assertNotNull(cfg);
        assertEquals(List.of("http://localhost:4200", "http://localhost:3000"), cfg.getAllowedOrigins());
        assertEquals(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"), cfg.getAllowedMethods());
        assertEquals(List.of("Authorization","Content-Type","X-Requested-With"), cfg.getAllowedHeaders());
        assertEquals(List.of("Authorization"), cfg.getExposedHeaders());
        assertTrue(cfg.getAllowCredentials());
    }

    @Test
    void testPasswordEncoderWorksCorrectly() {
        PasswordEncoder encoder = securityConfig.passwordEncoder();
        assertNotNull(encoder);
        String encoded = encoder.encode("secret123");
        assertTrue(encoder.matches("secret123", encoded));
        assertFalse(encoder.matches("wrong", encoded));
    }

    @Test
    void testPasswordEncoderCreatesDifferentHashes() {
        PasswordEncoder encoder = securityConfig.passwordEncoder();
        String hash1 = encoder.encode("abc123");
        String hash2 = encoder.encode("abc123");
        assertNotEquals(hash1, hash2);
        assertTrue(encoder.matches("abc123", hash1));
    }

    @Test
    void testAuthenticationManagerReturnsFromConfiguration() throws Exception {
        AuthenticationConfiguration config = mock(AuthenticationConfiguration.class);
        AuthenticationManager manager = mock(AuthenticationManager.class);
        when(config.getAuthenticationManager()).thenReturn(manager);

        AuthenticationManager result = securityConfig.authenticationManager(config);
        assertEquals(manager, result);
        verify(config).getAuthenticationManager();
    }

    @Test
    void testSecurityFilterChainBuildsSuccessfully() throws Exception {
        HttpSecurity http = mock(HttpSecurity.class, RETURNS_SELF);
        DefaultSecurityFilterChain chain = mock(DefaultSecurityFilterChain.class);
        when(http.build()).thenReturn(chain);

        SecurityFilterChain result = securityConfig.securityFilterChain(http);
        assertEquals(chain, result);
        verify(http).addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        verify(http).cors(any());
        verify(http).csrf(any());
        verify(http).sessionManagement(any());
        verify(http).securityContext(any());
        verify(http).authorizeHttpRequests(any());
        verify(http).oauth2Login(any());
        verify(http).build();
    }

    @Test
    void testConstructorStoresJwtAuthFilterAndBeansNotNull() {
        assertNotNull(securityConfig);
        assertNotNull(securityConfig.passwordEncoder());
        assertNotNull(securityConfig.corsConfigurationSource());
    }
}
