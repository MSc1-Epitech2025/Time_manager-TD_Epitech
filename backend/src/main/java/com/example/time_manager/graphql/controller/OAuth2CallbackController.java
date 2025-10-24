package com.example.time_manager.graphql.controller;

import com.example.time_manager.dto.auth.AuthOauthMicrosoft;
import com.example.time_manager.service.AuthMicrosoftService;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OAuth2CallbackController {

    private final AuthMicrosoftService authMicrosoftService;

    public OAuth2CallbackController(AuthMicrosoftService authMicrosoftService) {
        this.authMicrosoftService = authMicrosoftService;
    }

    @GetMapping("/oauth2/success")
    public Object onSuccess(Authentication auth) {
        System.out.println("ICI");
        var attributes = ((OAuth2User) auth.getPrincipal()).getAttributes();
        System.out.println("attribute", attributes);

        var dto = new AuthOauthMicrosoft(
                (String) attributes.get("email"),
                (String) attributes.get("given_name"),
                (String) attributes.get("family_name"),
                (String) attributes.get("oid"),
                (String) attributes.get("picture"),
                attributes
        );

        return authMicrosoftService.processMicrosoftUser(dto);
    }
}
