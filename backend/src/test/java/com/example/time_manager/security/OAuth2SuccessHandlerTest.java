package com.example.time_manager.security;

import com.example.time_manager.model.User;
import com.example.time_manager.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class OAuth2SuccessHandlerTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private Authentication authentication;

    @Mock
    private OidcUser oidcUser;

    private OAuth2SuccessHandler handler;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        handler = new OAuth2SuccessHandler(userService, jwtUtil);
        ReflectionTestUtils.setField(handler, "frontendUrl", "http://localhost:4200/");
    }

    @Test
    void onAuthenticationSuccess_existingUser_setsTokensAndRedirects() throws Exception {
        User existingUser = new User();
        existingUser.setId("user-id-1");
        existingUser.setEmail("test@example.com");
        existingUser.setFirstName("John");
        existingUser.setLastName("Doe");
        existingUser.setRole("[\"employee\"]");
        existingUser.setAzureOid("azure-oid-123");

        when(authentication.getPrincipal()).thenReturn(oidcUser);
        when(oidcUser.getEmail()).thenReturn("test@example.com");
        when(oidcUser.getClaim("oid")).thenReturn("azure-oid-123");
        when(userService.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
        when(jwtUtil.generateAccessToken("test@example.com", "user-id-1", "John", "[\"employee\"]"))
                .thenReturn("access-token");
        when(jwtUtil.generateRefreshToken("test@example.com", "user-id-1"))
                .thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(response, times(2)).addHeader(eq(HttpHeaders.SET_COOKIE), anyString());
        verify(response).sendRedirect(anyString());
    }

    @Test
    void onAuthenticationSuccess_newUser_createsUserAndSetsTokens() throws Exception {
        User newUser = new User();
        newUser.setId("new-user-id");
        newUser.setEmail("new@example.com");
        newUser.setFirstName("Jane");
        newUser.setLastName("Smith");
        newUser.setRole("[\"employee\"]");
        newUser.setAzureOid("azure-oid-new");

        when(authentication.getPrincipal()).thenReturn(oidcUser);
        when(oidcUser.getEmail()).thenReturn("new@example.com");
        when(oidcUser.getClaim("oid")).thenReturn("azure-oid-new");
        when(oidcUser.getGivenName()).thenReturn("Jane");
        when(oidcUser.getFamilyName()).thenReturn("Smith");
        when(userService.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userService.saveUserRaw(any(User.class))).thenReturn(newUser);
        when(jwtUtil.generateAccessToken(anyString(), anyString(), anyString(), anyString()))
                .thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(anyString(), anyString()))
                .thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(userService).saveUserRaw(any(User.class));
        verify(response).sendRedirect(anyString());
    }

    @Test
    void onAuthenticationSuccess_existingUserWithNullAzureOid_updatesAzureOid() throws Exception {
        User existingUser = new User();
        existingUser.setId("user-id-1");
        existingUser.setEmail("test@example.com");
        existingUser.setFirstName("John");
        existingUser.setLastName("Doe");
        existingUser.setRole("[\"employee\"]");
        existingUser.setAzureOid(null);

        when(authentication.getPrincipal()).thenReturn(oidcUser);
        when(oidcUser.getEmail()).thenReturn("test@example.com");
        when(oidcUser.getClaim("oid")).thenReturn("azure-oid-123");
        when(userService.findByEmail("test@example.com"))
                .thenReturn(Optional.of(existingUser));
        when(userService.saveUserRaw(any(User.class))).thenReturn(existingUser);
        when(jwtUtil.generateAccessToken(anyString(), anyString(), anyString(), anyString()))
                .thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(anyString(), anyString()))
                .thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(userService).saveUserRaw(existingUser);
        assertThat(existingUser.getAzureOid()).isEqualTo("azure-oid-123");
    }

    @Test
    void onAuthenticationSuccess_existingUserWithBlankAzureOid_updatesAzureOid() throws Exception {
        User existingUser = new User();
        existingUser.setId("user-id-1");
        existingUser.setEmail("test@example.com");
        existingUser.setFirstName("John");
        existingUser.setLastName("Doe");
        existingUser.setRole("[\"employee\"]");
        existingUser.setAzureOid("   ");

        when(authentication.getPrincipal()).thenReturn(oidcUser);
        when(oidcUser.getEmail()).thenReturn("test@example.com");
        when(oidcUser.getClaim("oid")).thenReturn("azure-oid-123");
        when(userService.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
        when(userService.saveUserRaw(any(User.class))).thenReturn(existingUser);
        when(jwtUtil.generateAccessToken(anyString(), anyString(), anyString(), anyString()))
                .thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(anyString(), anyString()))
                .thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(userService).saveUserRaw(existingUser);
    }

    @Test
    void onAuthenticationSuccess_verifyCookiesContent() throws Exception {
        User existingUser = new User();
        existingUser.setId("user-id-1");
        existingUser.setEmail("test@example.com");
        existingUser.setFirstName("John");
        existingUser.setLastName("Doe");
        existingUser.setRole("[\"employee\"]");
        existingUser.setAzureOid("oid");

        when(authentication.getPrincipal()).thenReturn(oidcUser);
        when(oidcUser.getEmail()).thenReturn("test@example.com");
        when(oidcUser.getClaim("oid")).thenReturn("oid");
        when(userService.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
        when(jwtUtil.generateAccessToken(anyString(), anyString(), anyString(), anyString()))
                .thenReturn("access-token-value");
        when(jwtUtil.generateRefreshToken(anyString(), anyString()))
                .thenReturn("refresh-token-value");

        handler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<String> cookieCaptor = ArgumentCaptor.forClass(String.class);
        verify(response, times(2)).addHeader(eq(HttpHeaders.SET_COOKIE), cookieCaptor.capture());

        assertThat(cookieCaptor.getAllValues())
                .anyMatch(c -> c.contains("access_token=access-token-value"))
                .anyMatch(c -> c.contains("refresh_token=refresh-token-value"));
    }

    @Test
    void onAuthenticationSuccess_redirectUrlContainsAllParameters() throws Exception {
        User existingUser = new User();
        existingUser.setId("id-123");
        existingUser.setEmail("user@test.com");
        existingUser.setFirstName("First");
        existingUser.setLastName("Last");
        existingUser.setRole("[\"admin\"]");
        existingUser.setAzureOid("oid");

        when(authentication.getPrincipal()).thenReturn(oidcUser);
        when(oidcUser.getEmail()).thenReturn("user@test.com");
        when(oidcUser.getClaim("oid")).thenReturn("oid");
        when(userService.findByEmail("user@test.com")).thenReturn(Optional.of(existingUser));
        when(jwtUtil.generateAccessToken(anyString(), anyString(), anyString(), anyString()))
                .thenReturn("token");
        when(jwtUtil.generateRefreshToken(anyString(), anyString()))
                .thenReturn("refresh");

        handler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<String> redirectCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).sendRedirect(redirectCaptor.capture());

        String redirectUrl = redirectCaptor.getValue();
        assertThat(redirectUrl).contains("firstName=First");
        assertThat(redirectUrl).contains("lastName=Last");
        assertThat(redirectUrl).contains("id=id-123");
    }
}
