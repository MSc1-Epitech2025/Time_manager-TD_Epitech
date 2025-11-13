//package com.example.time_manager.security;
//
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.mockito.ArgumentCaptor;
//import org.springframework.http.HttpMethod;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.config.Customizer;
//import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.security.web.DefaultSecurityFilterChain;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
//import java.util.List;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.Mockito.*;
//
//class SecurityConfigTest {
//
//    private JwtAuthFilter jwtAuthFilter;
//    private SecurityConfig securityConfig;
//
//    @BeforeEach
//    void setUp() {
//        jwtAuthFilter = mock(JwtAuthFilter.class);
//        securityConfig = new SecurityConfig(jwtAuthFilter);
//    }
//
//    @Test
//    void testCorsConfigurationSourceContainsExpectedSettings() {
//        var source = securityConfig.corsConfigurationSource();
//        var urlSource = (org.springframework.web.cors.UrlBasedCorsConfigurationSource) source;
//
//        var cfg = urlSource.getCorsConfigurations().get("/**");
//
//        assertNotNull(cfg);
//        assertEquals(List.of("http://localhost:4200", "http://localhost:3000"), cfg.getAllowedOrigins());
//        assertEquals(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"), cfg.getAllowedMethods());
//        assertEquals(List.of("Authorization","Content-Type","X-Requested-With"), cfg.getAllowedHeaders());
//        assertEquals(List.of("Authorization"), cfg.getExposedHeaders());
//    }
//
//    @Test
//    void testAuthenticationManagerReturnsFromConfig() throws Exception {
//        var config = mock(AuthenticationConfiguration.class);
//        var manager = mock(AuthenticationManager.class);
//        when(config.getAuthenticationManager()).thenReturn(manager);
//
//        assertEquals(manager, securityConfig.authenticationManager(config));
//    }
//
//    @Test
//    void testSecurityFilterChain_RegistersAllDSLSections() throws Exception {
//        HttpSecurity http = mock(HttpSecurity.class, RETURNS_SELF);
//
//        var chain = mock(DefaultSecurityFilterChain.class);
//        when(http.build()).thenReturn(chain);
//
//        var corsCap = ArgumentCaptor.forClass(Customizer.class);
//        var csrfCap = ArgumentCaptor.forClass(Customizer.class);
//        var sessCap = ArgumentCaptor.forClass(Customizer.class);
//        var ctxCap = ArgumentCaptor.forClass(Customizer.class);
//        var authCap = ArgumentCaptor.forClass(Customizer.class);
//        var oauthCap = ArgumentCaptor.forClass(Customizer.class);
//
//        securityConfig.securityFilterChain(http);
//
//        verify(http).cors(corsCap.capture());
//        verify(http).csrf(csrfCap.capture());
//        verify(http).sessionManagement(sessCap.capture());
//        verify(http).securityContext(ctxCap.capture());
//        verify(http).authorizeHttpRequests(authCap.capture());
//        verify(http).oauth2Login(oauthCap.capture());
//        verify(http).addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
//
//        assertNotNull(ctxCap.getValue());
//        assertNotNull(authCap.getValue());
//
//        var fakeMatchers = mock(FakeMatcherRegistry.class, RETURNS_SELF);
//
//        assertNotNull(authCap.getValue());
//
//        verify(fakeMatchers).requestMatchers("/actuator/health");
//        verify(fakeMatchers).requestMatchers(HttpMethod.POST, "/graphql");
//        verify(fakeMatchers).requestMatchers("/oauth2/**");
//        verify(fakeMatchers).anyRequest();
//    }
//
//    @Test
//    void testPasswordEncoder() {
//        PasswordEncoder encoder = securityConfig.passwordEncoder();
//        String hashed = encoder.encode("secret123");
//        assertTrue(encoder.matches("secret123", hashed));
//    }
//
//    public interface FakeMatcherRegistry {
//        FakeMatcherRegistry requestMatchers(String pattern);
//        FakeMatcherRegistry requestMatchers(HttpMethod method, String pattern);
//        FakeMatcherRegistry requestMatchers(String... patterns);
//        FakeMatcherRegistry anyRequest();
//    }
//}
