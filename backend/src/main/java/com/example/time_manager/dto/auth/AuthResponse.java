package com.example.time_manager.dto.auth;

public class AuthResponse {
    public boolean ok;
    public boolean firstConnection;

    public AuthResponse(boolean ok) { 
        this.ok = ok;
        this.firstConnection = false;
    }

    public AuthResponse(boolean ok, boolean firstConnection) { 
        this.ok = ok;
        this.firstConnection = firstConnection;
    }
}