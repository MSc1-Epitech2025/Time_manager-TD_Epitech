package com.example.time_manager.dto.auth;
public class TokenPairResponse {
  public String accessToken;
  public String refreshToken;
  public TokenPairResponse(String a, String r){ this.accessToken=a; this.refreshToken=r; }
}