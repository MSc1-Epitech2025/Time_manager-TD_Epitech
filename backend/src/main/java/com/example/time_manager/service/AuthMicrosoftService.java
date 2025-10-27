package com.example.time_manager.service;

import com.example.time_manager.dto.auth.AuthOauthMicrosoft;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthMicrosoftService {

    private final UserRepository userRepo;
    private final UserService userService;

    public AuthMicrosoftService(UserRepository userRepo, UserService userService) {
        this.userRepo = userRepo;
        this.userService = userService;
    }

    public User processMicrosoftUser(AuthOauthMicrosoft dto) {

        var existingByOid = userRepo.findByAzureOid(dto.azureOid());
        if (existingByOid.isPresent()) return existingByOid.get();

        var existingByEmail = userRepo.findByEmail(dto.email());
        if (existingByEmail.isPresent()) {
            var u = existingByEmail.get();
            u.setAzureOid(dto.azureOid());
            return userRepo.save(u);
        }

        User u = new User();
        u.setEmail(dto.email());
        u.setFirstName(dto.givenName());
        u.setLastName(dto.familyName());
        u.setAvatarUrl(dto.avatarId());
        u.setAzureOid(dto.azureOid());
        u.setRole("[\"employee\"]");
        return userService.saveUser(u);
    }
}
