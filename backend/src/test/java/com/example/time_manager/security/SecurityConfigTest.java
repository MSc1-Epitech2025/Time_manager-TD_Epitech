package com.example.time_manager.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.*;
import org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.DefaultSecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.NullSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import java.util.List;

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
    void testCorsConfigurationSourceContainsExpectedSettings() {
        var source = securityConfig.corsConfigurationSource();
        var urlSource = (org.springframework.web.cors.UrlBasedCorsConfigurationSource) source;

        var cfg = urlSource.getCorsConfigurations().get("/**");

        assertNotNull(cfg);
        assertEquals(List.of("http://localhost:4200", "http://localhost:3000"), cfg.getAllowedOrigins());
        assertEquals(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"), cfg.getAllowedMethods());
        assertEquals(List.of("Authorization","Content-Type","X-Requested-With"), cfg.getAllowedHeaders());
        assertEquals(List.of("Authorization"), cfg.getExposedHeaders());
        assertTrue(cfg.getAllowCredentials());
    }

    @Test
    void testAuthenticationManagerReturnsFromConfig() throws Exception {
        var config = mock(AuthenticationConfiguration.class);
        var manager = mock(AuthenticationManager.class);
        when(config.getAuthenticationManager()).thenReturn(manager);

        assertEquals(manager, securityConfig.authenticationManager(config));
    }

    @Test
    void testSecurityFilterChain_ConfiguresAllSections() throws Exception {
        HttpSecurity http = mock(HttpSecurity.class, RETURNS_SELF);
        var chain = mock(DefaultSecurityFilterChain.class);

        CsrfConfigurer<HttpSecurity> csrfConfigurer = mock(CsrfConfigurer.class, RETURNS_SELF);
        SessionManagementConfigurer<HttpSecurity> sessionConfigurer = mock(SessionManagementConfigurer.class, RETURNS_SELF);
        SecurityContextConfigurer<HttpSecurity> securityContextConfigurer = mock(SecurityContextConfigurer.class, RETURNS_SELF);

        @SuppressWarnings("unchecked")
        AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry authRegistry =
                mock(AuthorizeHttpRequestsConfigurer.AuthorizationManagerRequestMatcherRegistry.class, RETURNS_SELF);

        @SuppressWarnings("unchecked")
        AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizedUrl authorizedUrl =
                mock(AuthorizeHttpRequestsConfigurer.AuthorizedUrl.class);

        OAuth2LoginConfigurer<HttpSecurity> oauthConfigurer = mock(OAuth2LoginConfigurer.class, RETURNS_SELF);

        when(http.cors(any())).thenReturn(http);
        when(http.csrf(any())).thenReturn(http);
        when(http.sessionManagement(any())).thenReturn(http);
        when(http.securityContext(any())).thenReturn(http);
        when(http.authorizeHttpRequests(any())).thenReturn(http);
        when(http.oauth2Login(any())).thenReturn(http);
        when(http.build()).thenReturn(chain);

        when(authRegistry.requestMatchers(anyString())).thenReturn(authorizedUrl);
        when(authRegistry.requestMatchers(any(HttpMethod.class), anyString())).thenReturn(authorizedUrl);
        when(authRegistry.anyRequest()).thenReturn(authorizedUrl);
        when(authorizedUrl.permitAll()).thenReturn(authRegistry);
        when(authorizedUrl.authenticated()).thenReturn(authRegistry);

        ArgumentCaptor<Customizer> csrfCaptor = ArgumentCaptor.forClass(Customizer.class);
        ArgumentCaptor<Customizer> sessionCaptor = ArgumentCaptor.forClass(Customizer.class);
        ArgumentCaptor<Customizer> securityContextCaptor = ArgumentCaptor.forClass(Customizer.class);
        ArgumentCaptor<Customizer> authCaptor = ArgumentCaptor.forClass(Customizer.class);
        ArgumentCaptor<Customizer> oauthCaptor = ArgumentCaptor.forClass(Customizer.class);

        securityConfig.securityFilterChain(http);

        verify(http).cors(any());
        verify(http).csrf(csrfCaptor.capture());
        verify(http).sessionManagement(sessionCaptor.capture());
        verify(http).securityContext(securityContextCaptor.capture());
        verify(http).authorizeHttpRequests(authCaptor.capture());
        verify(http).oauth2Login(oauthCaptor.capture());
        verify(http).addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        csrfCaptor.getValue().customize(csrfConfigurer);
        verify(csrfConfigurer).ignoringRequestMatchers("/graphql");

        sessionCaptor.getValue().customize(sessionConfigurer);
        verify(sessionConfigurer).sessionCreationPolicy(SessionCreationPolicy.STATELESS);

        securityContextCaptor.getValue().customize(securityContextConfigurer);
        ArgumentCaptor<Boolean> requireExplicitSaveCaptor = ArgumentCaptor.forClass(Boolean.class);
        ArgumentCaptor<SecurityContextRepository> repoCaptor = ArgumentCaptor.forClass(SecurityContextRepository.class);

        verify(securityContextConfigurer).requireExplicitSave(requireExplicitSaveCaptor.capture());
        verify(securityContextConfigurer).securityContextRepository(repoCaptor.capture());

        assertFalse(requireExplicitSaveCaptor.getValue());
        assertInstanceOf(NullSecurityContextRepository.class, repoCaptor.getValue());

        authCaptor.getValue().customize(authRegistry);

        verify(authRegistry).requestMatchers("/actuator/health");
        verify(authRegistry).requestMatchers(HttpMethod.POST, "/graphql");
        verify(authRegistry).requestMatchers("/oauth2/**");
        verify(authRegistry).anyRequest();

        verify(authorizedUrl, times(3)).permitAll();
        verify(authorizedUrl, times(1)).authenticated();

        oauthCaptor.getValue().customize(oauthConfigurer);
        verify(oauthConfigurer).defaultSuccessUrl("/oauth2/success", true);
    }

    @Test
    void testPasswordEncoder() {
        PasswordEncoder encoder = securityConfig.passwordEncoder();
        String hashed = encoder.encode("secret123");
        assertTrue(encoder.matches("secret123", hashed));
        assertFalse(encoder.matches("wrongpassword", hashed));
    }
}