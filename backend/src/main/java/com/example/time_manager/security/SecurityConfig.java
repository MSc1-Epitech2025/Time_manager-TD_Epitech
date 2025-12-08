package com.example.time_manager.security;

import com.example.time_manager.model.User;
import com.example.time_manager.service.UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    // ⚠️ PAS de constructeur ici, PAS d'injection de UserService/JwtUtil en champ

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            JwtAuthFilter jwtAuthFilter,
                                            UserService userService,
                                            JwtUtil jwtUtil) throws Exception {

        http
                // API stateless
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/graphql").permitAll()

                        .requestMatchers(
                                "/oauth2/**",
                                "/login/oauth2/**"
                        ).permitAll()

                        .anyRequest().authenticated()
                )

                .oauth2Login(oauth -> oauth
                        .redirectionEndpoint(red -> red.baseUri("/login/oauth2/code/*"))

                        // 🔥 Success handler directement ici (plus de bean séparé)
                        .successHandler((request, response, authentication) -> {

                            OidcUser principal = (OidcUser) authentication.getPrincipal();
                            String email = principal.getEmail();
                            String azureOid = principal.getClaim("oid");

                            // --- Création ou mise à jour du user ---
                            User user = userService.findByEmail(email).orElseGet(() -> {
                                User u = new User();
                                u.setEmail(email);
                                u.setFirstName(principal.getGivenName());
                                u.setLastName(principal.getFamilyName());
                                u.setPassword("oauth2");
                                u.setRole("[\"employee\"]");
                                u.setAzureOid(azureOid);
                                return userService.saveUser(u);
                            });

                            if (user.getAzureOid() == null || user.getAzureOid().isBlank()) {
                                user.setAzureOid(azureOid);
                                userService.saveUser(user);
                            }

                            // --- Création des JWT ---
                            String accessToken = jwtUtil.generateAccessToken(
                                    user.getEmail(), user.getId(), user.getFirstName(), user.getRole()
                            );
                            String refreshToken = jwtUtil.generateRefreshToken(user.getEmail(), user.getId());

                            // --- Cookies ---
                            ResponseCookie accessCookie = ResponseCookie.from("access_token", accessToken)
                                    .httpOnly(true)
                                    .secure(false)      // mettre true en prod (HTTPS)
                                    .sameSite("None")
                                    .path("/")
                                    .build();

                            ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
                                    .httpOnly(true)
                                    .secure(false)
                                    .sameSite("None")
                                    .path("/")
                                    .build();

                            response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
                            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

                            // --- Redirection vers le frontend ---
                            response.sendRedirect("http://localhost:4205/auth/callback");
                        })
                )

                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:4205"));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
