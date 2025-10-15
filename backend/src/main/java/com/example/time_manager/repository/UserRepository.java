package com.example.time_manager.repository;

import com.example.time_manager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User, String> {

    List<User> findByIdIn(Collection<String> ids);
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
}
