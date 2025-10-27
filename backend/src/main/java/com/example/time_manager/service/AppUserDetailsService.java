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
            // JSON: ex ["employee","manager"] ou ["employee manager"]
            List<String> roles = mapper.readValue(raw, new TypeReference<List<String>>() {});
            var auths = roles.stream()
                .filter(s -> s != null)
                .flatMap(s -> java.util.Arrays.stream(s.split("[\\s,;|]+"))) // <-- split ici aussi
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .distinct()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .collect(Collectors.toList());
            return auths.isEmpty()
                ? List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
                : auths;
        } catch (Exception e) {
            // Non-JSON: ex "employee manager"
            var auths = java.util.Arrays.stream(raw.split("[\\s,;|]+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .distinct()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                .collect(Collectors.toList());
            return auths.isEmpty()
                ? List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
                : auths;
        }
    }
}
