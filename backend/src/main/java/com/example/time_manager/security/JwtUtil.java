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

    @Value("${security.jwt.secret}")
    private String secretB64;

    @Value("${security.jwt.issuer:time-manager}")
    private String issuer;

    @Value("${security.jwt.expMinutes:15}")
    private long expMinutes;

    private Key key() {
        // secret base64 de 32+ octets (256 bits)
        return Keys.hmacShaKeyFor(Base64.getDecoder().decode(secretB64));
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String generateToken(String username) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setIssuer(issuer)
                .setSubject(username)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(Duration.ofMinutes(expMinutes))))
                .setId(UUID.randomUUID().toString())
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, String username) {
        Claims c = extractAllClaims(token);
        return username.equals(c.getSubject()) && c.getExpiration().after(new Date());
    }
}
