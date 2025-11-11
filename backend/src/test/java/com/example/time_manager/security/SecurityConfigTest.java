package com.example.time_manager.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.DefaultSecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;
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
    void testCorsConfigurationSource_NotNull_AndContainsExpectedValues() {
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertNotNull(source);

        var urlSource = (org.springframework.web.cors.UrlBasedCorsConfigurationSource) source;
        var configs = urlSource.getCorsConfigurations();
        assertNotNull(configs);
        assertTrue(configs.containsKey("/**"));
        var cfg = configs.get("/**");

        assertTrue(cfg.getAllowedOrigins().contains("http://localhost:3000"));
        assertTrue(cfg.getAllowedMethods().contains("GET"));
        assertTrue(cfg.getAllowedHeaders().contains("Authorization"));
        assertTrue(cfg.getExposedHeaders().contains("Authorization"));
        assertTrue(cfg.getAllowCredentials());
    }

    @Test
    void testPasswordEncoder_EncodesAndMatches() {
        PasswordEncoder encoder = securityConfig.passwordEncoder();
        assertNotNull(encoder);
        String encoded = encoder.encode("mypassword");
        assertTrue(encoder.matches("mypassword", encoded));
    }

    @Test
    void testAuthenticationManager_ReturnsSameInstance() throws Exception {
        AuthenticationConfiguration config = mock(AuthenticationConfiguration.class);
        AuthenticationManager manager = mock(AuthenticationManager.class);
        when(config.getAuthenticationManager()).thenReturn(manager);

        AuthenticationManager result = securityConfig.authenticationManager(config);
        assertEquals(manager, result);
        verify(config).getAuthenticationManager();
    }

    @Test
    void testSecurityFilterChain_DoesNotThrow() throws Exception {
        var http = mock(org.springframework.security.config.annotation.web.builders.HttpSecurity.class, RETURNS_SELF);
        var mockChain = mock(DefaultSecurityFilterChain.class);
        when(http.build()).thenReturn(mockChain);

        assertDoesNotThrow(() -> {
            SecurityFilterChain chain = securityConfig.securityFilterChain(http);
            assertNotNull(chain);
            assertEquals(mockChain, chain);
        });
    }
}
