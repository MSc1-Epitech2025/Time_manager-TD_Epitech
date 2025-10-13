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

    // ====== PROPERTIES (injected from application.properties / .env) ======
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
    public String generateAccessToken(String username) {
        Instant now = Instant.now();
        return Jwts.builder()
            .setIssuer(issuer)
            .setSubject(username)
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(now.plus(Duration.ofMinutes(expMinutes))))
            .setId(UUID.randomUUID().toString())
            .signWith(accessKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    public boolean isAccessTokenValid(String token, String username) {
        Claims c = parseAccessClaims(token);
        return username.equals(c.getSubject()) && c.getExpiration().after(new Date());
    }

    public String extractUsername(String accessToken) {
        // used by JwtAuthFilter to read "sub" from the ACCESS token
        return parseAccessClaims(accessToken).getSubject();
    }

    private Claims parseAccessClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(accessKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    // ====== REFRESH TOKEN API ======
    public String generateRefreshToken(String username) {
        Instant now = Instant.now();
        return Jwts.builder()
            .setIssuer(issuer)
            .setSubject(username)
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(now.plus(Duration.ofDays(refreshDays))))
            .setId(UUID.randomUUID().toString())
            .signWith(refreshKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    public boolean isRefreshTokenValid(String token, String username) {
        Claims c = parseRefreshClaims(token);
        return username.equals(c.getSubject()) && c.getExpiration().after(new Date());
    }

    /** Helper used by /api/auth/refresh to read the subject from a REFRESH token. */
    public String parseRefreshSubject(String refreshToken) {
        return parseRefreshClaims(refreshToken).getSubject();
    }

    private Claims parseRefreshClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(refreshKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    // ====== GENERIC (if ever needed) ======
    public <T> T extractAccessClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(parseAccessClaims(token));
    }
}
