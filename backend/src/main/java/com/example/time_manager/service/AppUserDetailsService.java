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

    /**
     * Gestion simple des rôles :
     * - Accepte JSON array (ex: ["admin","manager"]) OU string (ex: "admin manager")
     * - Découpe sur espaces/virgules/; |, met en minuscule
     * - PAS de préfixe ROLE_
     * - Fallback: "employee" si vide
     */
private Collection<? extends GrantedAuthority> mapAuthorities(User u) {
    String raw = u.getRole();
    if (raw == null || raw.isBlank()) {
        return List.of(new SimpleGrantedAuthority("EMPLOYEE"));
    }
    try {
        List<String> roles;
        if (raw.startsWith("[")) {
            // Parse JSON array
            roles = mapper.readValue(raw, new TypeReference<List<String>>() {});
        } else {
            roles = List.of(raw);
        }
        
        var authorities = roles.stream()
            .filter(s -> s != null)
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(String::toUpperCase) // Convertit en majuscules
            .distinct()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
        
        return authorities.isEmpty() 
            ? List.of(new SimpleGrantedAuthority("EMPLOYEE"))
            : authorities;
    } catch (Exception e) {
        return List.of(new SimpleGrantedAuthority(raw.toUpperCase()));
    }
}
}
