package com.example.time_manager.security;

import java.security.Key;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    // ====== CLAIM KEYS (OIDC-friendly) ======
    public static final String CLAIM_GIVEN_NAME = "given_name";
    public static final String CLAIM_ROLE       = "role"; // ex: "MANAGER" / "EMPLOYEE"

    // ====== PROPERTIES ======
    @Value("${security.jwt.secret}")
    private String secretB64;

    @Value("${security.jwt.refreshSecret}")
    private String refreshSecretB64;

    @Value("${security.jwt.issuer:time-manager}")
    private String issuer;

    @Value("${security.jwt.expMinutes:15}")
    private long expMinutes;

    @Value("${security.jwt.refreshDays:45}")
    private long refreshDays;

    // ====== KEYS ======
    private Key accessKey()  { return Keys.hmacShaKeyFor(Base64.getDecoder().decode(secretB64)); }
    private Key refreshKey() { return Keys.hmacShaKeyFor(Base64.getDecoder().decode(refreshSecretB64)); }

    // ====== ACCESS TOKEN API ======
    /** Version rétro-compatible (sans claims additionnels) */
    public String generateAccessToken(String username) {
        return generateAccessToken(username, null, null);
    }

    /** Nouvelle version : ajoute le prénom et le rôle dans le token */
    public String generateAccessToken(String username, String firstName, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
            .setIssuer(issuer)
            .setSubject(username)
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(now.plus(Duration.ofMinutes(expMinutes))))
            .setId(UUID.randomUUID().toString())
            // --- custom claims ---
            .claim(CLAIM_GIVEN_NAME, firstName) // ignoré si null
            .claim(CLAIM_ROLE,       role)       // ignoré si null
            .signWith(accessKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    public boolean isAccessTokenValid(String token, String username) {
        Claims c = parseAccessClaims(token);
        return username.equals(c.getSubject()) && c.getExpiration().after(new Date());
    }

    public String extractUsername(String accessToken) {
        return parseAccessClaims(accessToken).getSubject();
    }

    public String extractFirstName(String accessToken) {
        return parseAccessClaims(accessToken).get(CLAIM_GIVEN_NAME, String.class);
    }

    public String extractRole(String accessToken) {
        return parseAccessClaims(accessToken).get(CLAIM_ROLE, String.class);
    }

    private Claims parseAccessClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(accessKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    // ====== REFRESH TOKEN API ======
    /** Rétro-compatible */
    public String generateRefreshToken(String username) {
        return generateRefreshToken(username, null, null);
    }

    /**
     * Optionnel : inclure aussi le prénom et le rôle dans le refresh token.
     * Si tu préfères un refresh minimal, n’utilise pas cette surcharge.
     */
    public String generateRefreshToken(String username, String firstName, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
            .setIssuer(issuer)
            .setSubject(username)
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(now.plus(Duration.ofDays(refreshDays))))
            .setId(UUID.randomUUID().toString())
            .claim(CLAIM_GIVEN_NAME, firstName)
            .claim(CLAIM_ROLE,       role)
            .signWith(refreshKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    public boolean isRefreshTokenValid(String token, String username) {
        Claims c = parseRefreshClaims(token);
        return username.equals(c.getSubject()) && c.getExpiration().after(new Date());
    }

    /** Helper utilisé par /api/auth/refresh pour lire le "sub" du REFRESH token. */
    public String parseRefreshSubject(String refreshToken) {
        return parseRefreshClaims(refreshToken).getSubject();
    }

    /** Optionnel : helpers si tu ajoutes les claims au refresh token. */
    public String extractRefreshFirstName(String refreshToken) {
        return parseRefreshClaims(refreshToken).get(CLAIM_GIVEN_NAME, String.class);
    }

    public String extractRefreshRole(String refreshToken) {
        return parseRefreshClaims(refreshToken).get(CLAIM_ROLE, String.class);
    }

    private Claims parseRefreshClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(refreshKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    // ====== GENERIC ======
    public <T> T extractAccessClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(parseAccessClaims(token));
    }
}
