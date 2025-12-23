package com.example.time_manager.security;

import com.example.time_manager.model.User;
import com.example.time_manager.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class OAuth2SuccessHandlerTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private Authentication authentication;

    @Mock
    private OidcUser oidcUser;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Captor
    private ArgumentCaptor<String> redirectCaptor;

    private OAuth2SuccessHandler handler;

    @BeforeEach
    void setUp() {
        handler = new OAuth2SuccessHandler(userService, jwtUtil);
        ReflectionTestUtils.setField(handler, "frontendUrl", "http://frontend/");
    }

    @Test
    void shouldAuthenticateExistingUserWithAzureOid() throws Exception {
        User user = buildUser("oid-123");

        when(authentication.getPrincipal()).thenReturn(oidcUser);
        when(oidcUser.getEmail()).thenReturn("test@mail.com");
        when(oidcUser.getClaim("oid")).thenReturn("oid-123");

        when(userService.findByEmail("test@mail.com"))
                .thenReturn(Optional.of(user));

        when(jwtUtil.generateAccessToken(any(), any(), any(), any()))
                .thenReturn("access");
        when(jwtUtil.generateRefreshToken(any(), any()))
                .thenReturn("refresh");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(response, times(2))
                .addHeader(eq(HttpHeaders.SET_COOKIE), anyString());
        verify(response).sendRedirect(anyString());

        verify(userService, never()).saveUser(any());
    }

    @Test
    void shouldCreateUserIfNotExists() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oidcUser);

        when(oidcUser.getEmail()).thenReturn("test@mail.com");
        when(oidcUser.getGivenName()).thenReturn("John");
        when(oidcUser.getFamilyName()).thenReturn("Doe");
        when(oidcUser.getClaim("oid")).thenReturn("oid-123");

        when(userService.findByEmail("test@mail.com"))
                .thenReturn(Optional.empty());

        when(userService.saveUser(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(jwtUtil.generateAccessToken(any(), any(), any(), any()))
                .thenReturn("access");
        when(jwtUtil.generateRefreshToken(any(), any()))
                .thenReturn("refresh");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(userService).saveUser(any(User.class));
        verify(response).sendRedirect(anyString());
    }

    @Test
    void shouldUpdateAzureOidIfMissing() throws Exception {
        User user = buildUser(null);

        when(authentication.getPrincipal()).thenReturn(oidcUser);
        when(oidcUser.getEmail()).thenReturn("test@mail.com");
        when(oidcUser.getClaim("oid")).thenReturn("oid-123");

        when(userService.findByEmail("test@mail.com"))
                .thenReturn(Optional.of(user));
        when(userService.saveUser(any())).thenReturn(user);

        when(jwtUtil.generateAccessToken(any(), any(), any(), any()))
                .thenReturn("access");
        when(jwtUtil.generateRefreshToken(any(), any()))
                .thenReturn("refresh");

        handler.onAuthenticationSuccess(request, response, authentication);

        assertEquals("oid-123", user.getAzureOid());
        verify(userService).saveUser(user);
    }

    private User buildUser(String azureOid) {
        User user = new User();
        user.setId(String.valueOf(1L));
        user.setEmail("test@mail.com");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setRole("[\"employee\"]");
        user.setAzureOid(azureOid);
        return user;
    }
}
