package com.example.time_manager.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.time_manager.dto.auth.UpdateUserInput;


import com.example.time_manager.model.User;
import com.example.time_manager.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /* ================== READ ================== */

    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    public User findByIdOrThrow(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }

    /* ================== CREATE ================== */

    public User saveUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User updateAvatar(String id, String avatarUrl) {
        User user = findByIdOrThrow(id);
        user.setAvatarUrl(avatarUrl);
        return userRepository.save(user);
    }

    public User updateRole(String id, String newRole) {
        User user = findByIdOrThrow(id);
        user.setRole(newRole);
        return userRepository.save(user);
    }

    public User updateEmail(String id, String newEmail) {
        User user = findByIdOrThrow(id);
        user.setEmail(newEmail);
        return userRepository.save(user);
    }

    public User updateName(String id, String newFirstName, String newLastName) {
        User user = findByIdOrThrow(id);
        user.setFirstName(newFirstName);
        user.setLastName(newLastName);
        return userRepository.save(user);
    }

    public User updatePhone(String id, String newPhone) {
        User user = findByIdOrThrow(id);
        user.setPhone(newPhone);
        return userRepository.save(user);
    }

    public User createUser(String email, String password, String firstName, String lastName) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        return userRepository.save(user);
    }
    
    public User deleteUser(String id) {
        User user = findByIdOrThrow(id);
        userRepository.delete(user);
        return user;
    }
    /* ================== MODIFY ================== */

public User updateUser(String id, UpdateUserInput in) {
    User u = findByIdOrThrow(id);

    if (in.firstName() != null) u.setFirstName(in.firstName());
    if (in.lastName()  != null) u.setLastName(in.lastName());
    if (in.email()     != null) u.setEmail(in.email());
    if (in.phone()     != null) u.setPhone(in.phone());
    if (in.role()      != null) u.setRole(in.role());
    if (in.poste()     != null) u.setPoste(in.poste());
    if (in.avatarUrl() != null) u.setAvatarUrl(in.avatarUrl());
    if (in.password()  != null && !in.password().isBlank()) {
        u.setPassword(passwordEncoder.encode(in.password()));
    }

    return userRepository.save(u);
}


    public void changePassword(String email, String currentPwd, String newPwd) {
        var user = userRepository.findByEmail(email).orElseThrow(
            () -> new EntityNotFoundException("User not found by email: " + email)
        );
        if (!passwordEncoder.matches(currentPwd, user.getPassword())) {
            throw new BadCredentialsException("Invalid current password");
        }
        user.setPassword(passwordEncoder.encode(newPwd));
        userRepository.save(user);
    }

    public boolean validateUser(String email, String password) {
        return userRepository.findByEmail(email)
                .map(user -> passwordEncoder.matches(password, user.getPassword()))
                .orElse(false);
    }

    public void completeFirstLogin(String userId) {
        User u = findByIdOrThrow(userId);
        if (u.isFirstConnection()) {
            u.setFirstConnection(false);
            userRepository.save(u);
        }
    }

    /* ================== DELETE ================== */

    public void deleteById(String id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }
}
