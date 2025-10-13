package com.example.time_manager.graphql.controller;

import com.example.time_manager.dto.AuthResponse;
import com.example.time_manager.graphql.dto.AuthRequestInput;
import com.example.time_manager.graphql.dto.CreateUserInput;
import com.example.time_manager.model.User;
import com.example.time_manager.security.JwtUtil;
import com.example.time_manager.service.UserService;
import org.springframework.graphql.data.method.annotation.*;
import org.springframework.stereotype.Controller;
import java.util.List;

@Controller
public class UserGraphQLController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public UserGraphQLController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    // ==== QUERY ====
    @QueryMapping
    public List<User> users() {
        return userService.findAllUsers();
    }

    @QueryMapping
    public User userByEmail(@Argument String email) {
        return userService.findByEmail(email).orElse(null);
    }

    // ==== MUTATION ====
    @MutationMapping
    public AuthResponse login(@Argument AuthRequestInput input) {
        if (!userService.validateUser(input.email(), input.password())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(input.email());
        return new AuthResponse(token);
    }

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
        return userService.saveUser(user);
    }
}
