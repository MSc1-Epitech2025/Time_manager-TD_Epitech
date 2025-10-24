package com.example.time_manager.dto.auth;

import java.util.Map;

public record AuthOauthMicrosoft(
        String email,
        String givenName,
        String familyName,
        String azureOid,
        String avatarId,
        Map<String, Object> raw
) {}
