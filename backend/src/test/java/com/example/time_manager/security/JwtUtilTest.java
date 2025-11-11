package com.example.time_manager.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;
import java.util.Date;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    private final String username = "john.doe";
    private final String userId = "123";
    private final String firstName = "John";
    private final String role = "MANAGER";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();

        String secret = Base64.getEncoder().encodeToString("mysecretkeymysecretkeymysecretkey12".getBytes());
        String refreshSecret = Base64.getEncoder().encodeToString("myrefreshkeymyrefreshkeymyrefreshkey34".getBytes());

        ReflectionTestUtils.setField(jwtUtil, "secretB64", secret);
        ReflectionTestUtils.setField(jwtUtil, "refreshSecretB64", refreshSecret);
        ReflectionTestUtils.setField(jwtUtil, "issuer", "time-manager");
        ReflectionTestUtils.setField(jwtUtil, "expMinutes", 1L);
        ReflectionTestUtils.setField(jwtUtil, "refreshDays", 1L);
    }

    @Test
    void testGenerateAndParseAccessToken() {
        String token = jwtUtil.generateAccessToken(username, userId, firstName, role);
        assertNotNull(token);

        String extractedUsername = jwtUtil.extractUsername(token);
        assertEquals(username, extractedUsername);

        String extractedFirstName = jwtUtil.extractFirstName(token);
        assertEquals(firstName, extractedFirstName);

        String extractedRole = jwtUtil.extractRole(token);
        assertEquals(role, extractedRole);

        boolean valid = jwtUtil.isAccessTokenValid(token, username);
        assertTrue(valid);
    }

    @Test
    void testAccessTokenInvalidUsername() {
        String token = jwtUtil.generateAccessToken(username, userId, firstName, role);
        boolean valid = jwtUtil.isAccessTokenValid(token, "wrongUser");
        assertFalse(valid);
    }

    @Test
    void testAccessTokenExpired() throws InterruptedException {
        ReflectionTestUtils.setField(jwtUtil, "expMinutes", 0L);
        String token = jwtUtil.generateAccessToken(username, userId, firstName, role);

        Thread.sleep(10);

        try {
            boolean valid = jwtUtil.isAccessTokenValid(token, username);
            assertFalse(valid);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            assertTrue(true);
        }
    }

    @Test
    void testGenerateAndParseRefreshToken() {
        String refreshToken = jwtUtil.generateRefreshToken(username, userId);
        assertNotNull(refreshToken);

        String parsedSubject = jwtUtil.parseRefreshSubject(refreshToken);
        assertEquals(username, parsedSubject);

        boolean valid = jwtUtil.isRefreshTokenValid(refreshToken, username);
        assertTrue(valid);
    }

    @Test
    void testRefreshTokenInvalidUsername() {
        String refreshToken = jwtUtil.generateRefreshToken(username, userId);
        boolean valid = jwtUtil.isRefreshTokenValid(refreshToken, "someoneelse");
        assertFalse(valid);
    }

    @Test
    void testRefreshTokenExpired() throws InterruptedException {
        ReflectionTestUtils.setField(jwtUtil, "refreshDays", 0L);
        String refreshToken = jwtUtil.generateRefreshToken(username, userId);

        Thread.sleep(10);

        try {
            boolean valid = jwtUtil.isRefreshTokenValid(refreshToken, username);
            assertFalse(valid);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            assertTrue(true);
        }
    }

    @Test
    void testExtractAccessClaimWithLambda() {
        String token = jwtUtil.generateAccessToken(username, userId, firstName, role);
        String subject = jwtUtil.extractAccessClaim(token, Claims::getSubject);
        assertEquals(username, subject);
    }

    @Test
    void testExtractRefreshFirstNameAndRole_NullClaims() {
        String refreshToken = jwtUtil.generateRefreshToken(username, userId);
        assertNull(jwtUtil.extractRefreshFirstName(refreshToken));
        assertNull(jwtUtil.extractRefreshRole(refreshToken));
    }

    @Test
    void testClaimsContainExpectedData() {
        String token = jwtUtil.generateAccessToken(username, userId, firstName, role);
        Claims claims = jwtUtil.extractAccessClaim(token, c -> c);
        assertEquals(username, claims.getSubject());
        assertEquals(firstName, claims.get("given_name"));
        assertEquals(role, claims.get("role"));
        assertNotNull(claims.get("uid"));
        assertNotNull(claims.getExpiration());
        assertTrue(claims.getExpiration().after(new Date(System.currentTimeMillis() - 1000)));
    }
}
