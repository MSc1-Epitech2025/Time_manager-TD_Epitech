package com.example.time_manager.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.time_manager.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    // Recherche d’un utilisateur par email
    Optional<User> findByEmail(String email);
    // Vérifie si un email existe déjà (utile pour /register)
    boolean existsByEmail(String email);
    
}
