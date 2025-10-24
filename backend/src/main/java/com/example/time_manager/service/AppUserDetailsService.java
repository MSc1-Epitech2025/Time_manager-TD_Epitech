package com.example.time_manager.service;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.time_manager.model.User;
import com.example.time_manager.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository repo;
    private final ObjectMapper mapper = new ObjectMapper();

    public AppUserDetailsService(UserRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User u = repo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));
        Collection<? extends GrantedAuthority> authorities = mapAuthorities(u);
        return new org.springframework.security.core.userdetails.User(
                u.getEmail(), u.getPassword(), authorities);
    }

    private Collection<? extends GrantedAuthority> mapAuthorities(User u) {
        String raw = u.getRole();
        if (raw == null || raw.isBlank()) {
            return List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"));
        }
        try {
            List<String> roles = mapper.readValue(raw, new TypeReference<List<String>>() {
            });
            return roles.stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(r -> "ROLE_" + r.toUpperCase())
                    .distinct()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            String[] tokens = raw.split("[\\s,;|]+");
            return java.util.Arrays.stream(tokens)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(r -> "ROLE_" + r.toUpperCase())
                    .distinct()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        }
    }
}
