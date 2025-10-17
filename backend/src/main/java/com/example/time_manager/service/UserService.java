package com.example.time_manager.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public User updateUser(String id, /* UserUpdateRequest */ Object updateReq) {
        User user = findByIdOrThrow(id);
        return userRepository.save(user);
    }

    /* ================== PASSWORD ================== */

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

    /* ================== DELETE ================== */

    public void deleteById(String id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }
}
