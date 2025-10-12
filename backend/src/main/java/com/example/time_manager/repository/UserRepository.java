package com.example.time_manager.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.time_manager.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    // Search user by email
    Optional<User> findByEmail(String email);
    // Check if email exists
    boolean existsByEmail(String email);
    
}
