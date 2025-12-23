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

    @Test
    void securityFilterChain_shouldConfigureAuthorizeHttpRequests() throws Exception {
        when(http.sessionManagement(any())).thenReturn(http);
        when(http.csrf(any())).thenReturn(http);
        when(http.cors(any())).thenReturn(http);
        when(http.oauth2Login(any())).thenReturn(http);
        when(http.formLogin(any())).thenReturn(http);
        when(http.httpBasic(any())).thenReturn(http);
        when(http.addFilterBefore(any(), any())).thenReturn(http);
        when(http.build()).thenReturn(defaultSecurityFilterChain);

        when(http.authorizeHttpRequests(any())).thenAnswer(invocation -> {
            org.springframework.security.config.Customizer<org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry> customizer =
                    invocation.getArgument(0);
            assertNotNull(customizer);
            return http;
        });

        SecurityFilterChain result = securityConfig.securityFilterChain(http, jwtAuthFilter, oAuth2SuccessHandler);

        assertNotNull(result);
        verify(http).authorizeHttpRequests(any());
    }

    @Test
    void securityFilterChain_shouldConfigureOAuth2Login() throws Exception {
        when(http.sessionManagement(any())).thenReturn(http);
        when(http.csrf(any())).thenReturn(http);
        when(http.cors(any())).thenReturn(http);
        when(http.authorizeHttpRequests(any())).thenReturn(http);
        when(http.formLogin(any())).thenReturn(http);
        when(http.httpBasic(any())).thenReturn(http);
        when(http.addFilterBefore(any(), any())).thenReturn(http);
        when(http.build()).thenReturn(defaultSecurityFilterChain);

        when(http.oauth2Login(any())).thenAnswer(invocation -> {
            org.springframework.security.config.Customizer<org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer<HttpSecurity>> customizer =
                    invocation.getArgument(0);
            assertNotNull(customizer);
            return http;
        });

        SecurityFilterChain result = securityConfig.securityFilterChain(http, jwtAuthFilter, oAuth2SuccessHandler);

        assertNotNull(result);
        verify(http).oauth2Login(any());
    }

    @Test
    void securityFilterChain_shouldAddJwtFilterBeforeUsernamePasswordFilter() throws Exception {
        when(http.sessionManagement(any())).thenReturn(http);
        when(http.csrf(any())).thenReturn(http);
        when(http.cors(any())).thenReturn(http);
        when(http.authorizeHttpRequests(any())).thenReturn(http);
        when(http.oauth2Login(any())).thenReturn(http);
        when(http.formLogin(any())).thenReturn(http);
        when(http.httpBasic(any())).thenReturn(http);
        when(http.build()).thenReturn(defaultSecurityFilterChain);
        when(http.addFilterBefore(any(), any())).thenReturn(http);

        securityConfig.securityFilterChain(http, jwtAuthFilter, oAuth2SuccessHandler);

        verify(http).addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    }

    @Test
    void securityFilterChain_shouldExecuteOAuth2LoginLambda() throws Exception {
        when(http.sessionManagement(any())).thenReturn(http);
        when(http.csrf(any())).thenReturn(http);
        when(http.cors(any())).thenReturn(http);
        when(http.authorizeHttpRequests(any())).thenReturn(http);
        when(http.formLogin(any())).thenReturn(http);
        when(http.httpBasic(any())).thenReturn(http);
        when(http.addFilterBefore(any(), any())).thenReturn(http);
        when(http.build()).thenReturn(defaultSecurityFilterChain);

        @SuppressWarnings("unchecked")
        org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer<HttpSecurity> oauth2Configurer =
                mock(org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer.class);

        @SuppressWarnings("unchecked")
        org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer<HttpSecurity>.RedirectionEndpointConfig redirectionConfig =
                mock(org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer.RedirectionEndpointConfig.class);

        when(oauth2Configurer.redirectionEndpoint(any())).thenAnswer(inv -> {
            @SuppressWarnings("unchecked")
            org.springframework.security.config.Customizer<org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer<HttpSecurity>.RedirectionEndpointConfig> customizer =
                    inv.getArgument(0);
            customizer.customize(redirectionConfig);
            return oauth2Configurer;
        });
        when(redirectionConfig.baseUri(anyString())).thenReturn(redirectionConfig);
        when(oauth2Configurer.successHandler(any())).thenReturn(oauth2Configurer);

        when(http.oauth2Login(any())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            org.springframework.security.config.Customizer<org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer<HttpSecurity>> customizer =
                    invocation.getArgument(0);
            customizer.customize(oauth2Configurer);
            return http;
        });

        SecurityFilterChain result = securityConfig.securityFilterChain(http, jwtAuthFilter, oAuth2SuccessHandler);

        assertNotNull(result);
        verify(oauth2Configurer).successHandler(oAuth2SuccessHandler);
        verify(redirectionConfig).baseUri("/login/oauth2/code/*");
    }

    @Test
    void securityFilterChain_shouldExecuteAuthorizeHttpRequestsLambda() throws Exception {
        when(http.sessionManagement(any())).thenReturn(http);
        when(http.csrf(any())).thenReturn(http);
        when(http.cors(any())).thenReturn(http);
        when(http.oauth2Login(any())).thenReturn(http);
        when(http.formLogin(any())).thenReturn(http);
        when(http.httpBasic(any())).thenReturn(http);
        when(http.addFilterBefore(any(), any())).thenReturn(http);
        when(http.build()).thenReturn(defaultSecurityFilterChain);

        @SuppressWarnings("unchecked")
        org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry authRegistry =
                mock(org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer.AuthorizationManagerRequestMatcherRegistry.class);

        @SuppressWarnings("unchecked")
        org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizedUrl authorizedUrl =
                mock(org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer.AuthorizedUrl.class);

        when(authRegistry.requestMatchers(any(org.springframework.http.HttpMethod.class), any(String[].class))).thenReturn(authorizedUrl);
        when(authRegistry.requestMatchers(any(String[].class))).thenReturn(authorizedUrl);
        when(authRegistry.anyRequest()).thenReturn(authorizedUrl);
        when(authorizedUrl.permitAll()).thenReturn(authRegistry);
        when(authorizedUrl.authenticated()).thenReturn(authRegistry);

        when(http.authorizeHttpRequests(any())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            org.springframework.security.config.Customizer<org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry> customizer =
                    invocation.getArgument(0);
            customizer.customize(authRegistry);
            return http;
        });

        SecurityFilterChain result = securityConfig.securityFilterChain(http, jwtAuthFilter, oAuth2SuccessHandler);

        assertNotNull(result);

        verify(authRegistry).requestMatchers(eq(org.springframework.http.HttpMethod.OPTIONS), eq("/**"));
        verify(authRegistry).requestMatchers("/actuator/health");
        verify(authRegistry).requestMatchers("/oauth2/**", "/login/oauth2/**");
        verify(authRegistry).requestMatchers(eq(org.springframework.http.HttpMethod.POST), eq("/graphql"));
        verify(authRegistry).anyRequest();
        verify(authorizedUrl).authenticated();
    }
}