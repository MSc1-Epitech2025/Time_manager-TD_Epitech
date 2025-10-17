package com.example.time_manager.graphql.controller;

import java.util.List;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import com.example.time_manager.dto.auth.AuthRequest;
import com.example.time_manager.dto.auth.AuthResponse;
import com.example.time_manager.dto.auth.CreateUserInput;
import com.example.time_manager.model.User;
import com.example.time_manager.security.JwtUtil;
import com.example.time_manager.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;

@PreAuthorize("isAuthenticated()")
@Controller
public class UserGraphQLController {
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public UserGraphQLController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @QueryMapping
    public List<User> users() {
        return userService.findAllUsers();
    }

    @QueryMapping
    public User userByEmail(@Argument String email) {
        return userService.findByEmail(email).orElse(null);
    }

    @PreAuthorize("permitAll()")
    @MutationMapping
    public AuthResponse login(@Argument AuthRequest input) {
        if (!userService.validateUser(input.getEmail(), input.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        User user = userService.findByEmail(input.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found after validation"));

        String token = jwtUtil.generateAccessToken(
            user.getEmail(),
            user.getId().toString(),
            user.getFirstName(),
            user.getRole()
        );
        return new AuthResponse(token);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @MutationMapping
    public User register(@Argument CreateUserInput input) {
        User user = new User();
        user.setFirstName(input.firstName());
        user.setLastName(input.lastName());
        user.setEmail(input.email());
        user.setPhone(input.phone());
        user.setRole(input.role());
        user.setPoste(input.poste());
        user.setPassword(input.password());
        user.setAvatarUrl(input.avatarUrl());
        return userService.saveUser(user);
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Boolean deleteUser(@Argument String id) {
        userService.deleteById(id);
        return true;
    }

    @MutationMapping
    public User updateUserAvatar(@Argument String id, @Argument String avatarUrl) {
        return userService.updateAvatar(id, avatarUrl);
    }
}
