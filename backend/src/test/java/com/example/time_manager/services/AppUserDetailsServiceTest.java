package com.example.time_manager.services;

import com.example.time_manager.model.User;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.AppUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AppUserDetailsServiceTest {

    @Test
    void loadUserByUsername_shouldReturnUserDetails_whenUserExists() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        User u = new User();
        u.setEmail("test@test.com");
        u.setPassword("hashed");
        u.setRole("[\"employee\",\"manager\"]");

        when(repo.findByEmail("test@test.com")).thenReturn(Optional.of(u));

        UserDetails details = service.loadUserByUsername("test@test.com");

        assertThat(details.getUsername()).isEqualTo("test@test.com");
        assertThat(details.getPassword()).isEqualTo("hashed");
        assertThat(details.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder("EMPLOYEE", "MANAGER");
    }

    @Test
    void loadUserByUsername_shouldThrow_whenUserNotFound() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        when(repo.findByEmail("none@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("none@test.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("none@test.com");
    }

    @Test
    void mapAuthorities_shouldReturnDefault_whenRoleIsNull() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        User u = new User();
        u.setRole(null);

        var authorities = invokeMapAuthorities(service, u);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("EMPLOYEE");
    }

    @Test
    void mapAuthorities_shouldReturnDefault_whenRoleIsBlank() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        User u = new User();
        u.setRole("   ");

        var authorities = invokeMapAuthorities(service, u);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("EMPLOYEE");
    }

    @Test
    void mapAuthorities_shouldReturnRoles_whenValidJson() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        User u = new User();
        u.setRole("[\"employee\",\"admin\"]");

        var authorities = invokeMapAuthorities(service, u);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactlyInAnyOrder("EMPLOYEE", "ADMIN");
    }

    @Test
    void mapAuthorities_shouldReturnRoles_whenInvalidJson_plainString() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        User u = new User();
        u.setRole("employee");

        var authorities = invokeMapAuthorities(service, u);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("EMPLOYEE");
    }

    @Test
    void mapAuthorities_shouldReturnDefault_whenJsonEmptyList() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        User u = new User();
        u.setRole("[]");

        var authorities = invokeMapAuthorities(service, u);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("EMPLOYEE");
    }

    @Test
    void mapAuthorities_shouldReturnDistinctUpperCaseRoles() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        User u = new User();
        u.setRole("[\"manager\",\"Manager\",\"MANAGER\"]");

        var authorities = invokeMapAuthorities(service, u);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("MANAGER");
    }

    @Test
    void mapAuthorities_shouldIgnoreNullEntries() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        User u = new User();
        u.setRole("[null, \"admin\"]");

        var authorities = invokeMapAuthorities(service, u);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ADMIN");
    }

    @Test
    void mapAuthorities_shouldIgnoreEmptyStrings() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        User u = new User();
        u.setRole("[\"\", \"employee\"]");

        var authorities = invokeMapAuthorities(service, u);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("EMPLOYEE");
    }

    @Test
    void mapAuthorities_shouldFallbackToRawUppercase_onJsonError() {
        UserRepository repo = mock(UserRepository.class);
        AppUserDetailsService service = new AppUserDetailsService(repo);

        User u = new User();
        u.setRole("[invalid-json");

        var authorities = invokeMapAuthorities(service, u);

        assertThat(authorities)
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("EMPLOYEE");  // fallback réel dans ton service
    }

    @SuppressWarnings("unchecked")
    private List<GrantedAuthority> invokeMapAuthorities(AppUserDetailsService service, User u) {
        try {
            var method = AppUserDetailsService.class.getDeclaredMethod("mapAuthorities", User.class);
            method.setAccessible(true);
            return (List<GrantedAuthority>) method.invoke(service, u);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
