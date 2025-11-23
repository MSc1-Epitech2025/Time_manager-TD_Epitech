package com.example.time_manager.dto.auth;

public class AuthResponse {
    private boolean ok;

    public AuthResponse(boolean ok) { this.ok = ok; }

    public boolean isOk() { return ok; }
}
