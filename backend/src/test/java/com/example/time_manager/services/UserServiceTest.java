package com.example.time_manager.services;

import com.example.time_manager.dto.auth.UpdateUserInput;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class UserServiceTestTest {

    @Test
    void findAllUsers_shouldReturnListFromRepository() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        User u1 = new User(); u1.setId("1");
        User u2 = new User(); u2.setId("2");
        when(userRepository.findAll()).thenReturn(List.of(u1, u2));

        List<User> result = userService.findAllUsers();

        assertThat(result).containsExactly(u1, u2);
        verify(userRepository).findAll();
    }

    @Test
    void findByEmail_shouldReturnOptionalUser_whenPresent() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        User u = new User(); u.setEmail("a@b.com");
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(u));

        Optional<User> result = userService.findByEmail("a@b.com");

        assertThat(result).isPresent().contains(u);
        verify(userRepository).findByEmail("a@b.com");
    }

    @Test
    void findByEmail_shouldReturnEmpty_whenAbsent() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        when(userRepository.findByEmail("x@y.com")).thenReturn(Optional.empty());

        Optional<User> result = userService.findByEmail("x@y.com");

        assertThat(result).isEmpty();
        verify(userRepository).findByEmail("x@y.com");
    }

    @Test
    void findByIdOrThrow_shouldReturnUser_whenExists() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        User user = new User();
        user.setId("123");
        when(userRepository.findById("123")).thenReturn(Optional.of(user));

        User result = userService.findByIdOrThrow("123");

        assertThat(result).isEqualTo(user);
    }

    @Test
    void findByIdOrThrow_shouldThrow_whenNotExists() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        when(userRepository.findById("999")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findByIdOrThrow("999"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void saveUser_shouldEncodePasswordAndSave() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        User toSave = new User();
        toSave.setPassword("plain");
        User saved = new User(); saved.setId("1");

        when(encoder.encode("plain")).thenReturn("ENCODED");
        when(userRepository.save(toSave)).thenReturn(saved);

        User result = userService.saveUser(toSave);

        assertThat(result.getId()).isEqualTo("1");
        assertThat(toSave.getPassword()).isEqualTo("ENCODED");
        verify(encoder).encode("plain");
        verify(userRepository).save(toSave);
    }

    @Test
    void createUser_shouldBuildEncodeAndSave() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        when(encoder.encode("pwd")).thenReturn("ENCODED");
        User saved = new User(); saved.setId("123");
        when(userRepository.save(any(User.class))).thenReturn(saved);

        User result = userService.createUser("mail@test.com","pwd","Bob","Smith");

        assertThat(result.getId()).isEqualTo("123");
        verify(encoder).encode("pwd");
        verify(userRepository).save(argThat(u ->
                "mail@test.com".equals(u.getEmail())
                        && "ENCODED".equals(u.getPassword())
                        && "Bob".equals(u.getFirstName())
                        && "Smith".equals(u.getLastName())
        ));
    }

    @Test
    void updateAvatar_shouldUpdateAndSave() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        User u = new User(); u.setId("id"); u.setAvatarUrl("old");
        when(userRepository.findById("id")).thenReturn(Optional.of(u));
        when(userRepository.save(u)).thenReturn(u);

        User result = userService.updateAvatar("id", "newUrl");

        assertThat(result.getAvatarUrl()).isEqualTo("newUrl");
        verify(userRepository).save(u);
    }

    @Test
    void updateRole_shouldUpdateAndSave() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        User u = new User(); u.setId("id"); u.setRole("USER");
        when(userRepository.findById("id")).thenReturn(Optional.of(u));
        when(userRepository.save(u)).thenReturn(u);

        User result = userService.updateRole("id", "ADMIN");

        assertThat(result.getRole()).isEqualTo("ADMIN");
        verify(userRepository).save(u);
    }

    @Test
    void updateEmail_shouldUpdateAndSave() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        User u = new User(); u.setId("id"); u.setEmail("old@x.com");
        when(userRepository.findById("id")).thenReturn(Optional.of(u));
        when(userRepository.save(u)).thenReturn(u);

        User result = userService.updateEmail("id", "new@y.com");

        assertThat(result.getEmail()).isEqualTo("new@y.com");
        verify(userRepository).save(u);
    }

    @Test
    void updateName_shouldUpdateAndSave() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        User u = new User(); u.setId("id");
        when(userRepository.findById("id")).thenReturn(Optional.of(u));
        when(userRepository.save(u)).thenReturn(u);

        User result = userService.updateName("id", "John", "Doe");

        assertThat(result.getFirstName()).isEqualTo("John");
        assertThat(result.getLastName()).isEqualTo("Doe");
        verify(userRepository).save(u);
    }

    @Test
    void updatePhone_shouldUpdateAndSave() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        User u = new User(); u.setId("id"); u.setPhone("000");
        when(userRepository.findById("id")).thenReturn(Optional.of(u));
        when(userRepository.save(u)).thenReturn(u);

        User result = userService.updatePhone("id", "123456");

        assertThat(result.getPhone()).isEqualTo("123456");
        verify(userRepository).save(u);
    }

    @Test
    void updateUser_shouldFindAndSave() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        User u = new User(); u.setId("id");
        when(userRepository.findById("id")).thenReturn(Optional.of(u));
        when(userRepository.save(u)).thenReturn(u);

        User result = userService.updateUser("id", mock(UpdateUserInput.class));

        assertThat(result).isEqualTo(u);
        verify(userRepository).save(u);
    }

    @Test
    void deleteUser_shouldDeleteAndReturnUser() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        User u = new User(); u.setId("id");
        when(userRepository.findById("id")).thenReturn(Optional.of(u));

        User result = userService.deleteUser("id");

        assertThat(result).isEqualTo(u);
        verify(userRepository).delete(u);
    }

    @Test
    void deleteUser_shouldThrow_whenNotFound() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        when(userRepository.findById("id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser("id"))
                .isInstanceOf(EntityNotFoundException.class);
        verify(userRepository, never()).delete(any());
    }

    @Test
    void deleteById_shouldDelete_whenExists() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        when(userRepository.existsById("id")).thenReturn(true);

        userService.deleteById("id");

        verify(userRepository).deleteById("id");
    }

    @Test
    void deleteById_shouldThrow_whenNotExists() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        when(userRepository.existsById("id")).thenReturn(false);

        assertThatThrownBy(() -> userService.deleteById("id"))
                .isInstanceOf(EntityNotFoundException.class);
        verify(userRepository, never()).deleteById(anyString());
    }

    @Test
    void changePassword_shouldEncodeAndSave_whenCurrentMatches() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        User u = new User(); u.setEmail("a@b.com"); u.setPassword("HASH");
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(u));
        when(encoder.matches("old", "HASH")).thenReturn(true);
        when(encoder.encode("new")).thenReturn("NEW_HASH");

        userService.changePassword("a@b.com", "old", "new");

        assertThat(u.getPassword()).isEqualTo("NEW_HASH");
        verify(userRepository).save(u);
    }

    @Test
    void changePassword_shouldThrow_whenEmailNotFound() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        when(userRepository.findByEmail("none@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.changePassword("none@x.com", "old", "new"))
                .isInstanceOf(EntityNotFoundException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_shouldThrow_whenCurrentDoesNotMatch() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        User u = new User(); u.setEmail("a@b.com"); u.setPassword("HASH");
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(u));
        when(encoder.matches("bad", "HASH")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword("a@b.com", "bad", "new"))
                .isInstanceOf(BadCredentialsException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void validateUser_shouldReturnTrue_whenPasswordMatches() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        User u = new User(); u.setEmail("a@b.com"); u.setPassword("HASH");
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(u));
        when(encoder.matches("pwd", "HASH")).thenReturn(true);

        boolean result = userService.validateUser("a@b.com", "pwd");

        assertThat(result).isTrue();
    }

    @Test
    void validateUser_shouldReturnFalse_whenUserNotFound() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        when(userRepository.findByEmail("none@x.com")).thenReturn(Optional.empty());

        boolean result = userService.validateUser("none@x.com", "pwd");

        assertThat(result).isFalse();
    }

    @Test
    void validateUser_shouldReturnFalse_whenPasswordDoesNotMatch() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        User u = new User(); u.setEmail("a@b.com"); u.setPassword("HASH");
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(u));
        when(encoder.matches("bad", "HASH")).thenReturn(false);

        boolean result = userService.validateUser("a@b.com", "bad");

        assertThat(result).isFalse();
    }

    @Test
    void updateUser_shouldUpdateAllFieldsAndEncodePassword() {

        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        User u = new User();
        u.setId("id");

        when(userRepository.findById("id")).thenReturn(Optional.of(u));
        when(encoder.encode("newPass")).thenReturn("ENCODED_PASS");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserInput input = mock(UpdateUserInput.class);

        when(input.firstName()).thenReturn("John");
        when(input.lastName()).thenReturn("Doe");
        when(input.email()).thenReturn("john@doe.com");
        when(input.phone()).thenReturn("0600000000");
        when(input.role()).thenReturn("ADMIN");
        when(input.poste()).thenReturn("Developer");
        when(input.avatarUrl()).thenReturn("http://avatar.com/img.png");
        when(input.password()).thenReturn("newPass");

        User result = userService.updateUser("id", input);

        assertThat(result.getFirstName()).isEqualTo("John");
        assertThat(result.getLastName()).isEqualTo("Doe");
        assertThat(result.getEmail()).isEqualTo("john@doe.com");
        assertThat(result.getPhone()).isEqualTo("0600000000");
        assertThat(result.getRole()).isEqualTo("ADMIN");
        assertThat(result.getPoste()).isEqualTo("Developer");
        assertThat(result.getAvatarUrl()).isEqualTo("http://avatar.com/img.png");

        assertThat(result.getPassword()).isEqualTo("ENCODED_PASS");

        verify(encoder).encode("newPass");
        verify(userRepository).save(u);
    }

    @Test
    void updateUser_shouldNotEncodePassword_whenPasswordIsNullOrBlank() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        UserService userService = new UserService(userRepository, encoder);

        User u = new User();
        u.setId("id");
        u.setPassword("OLD_HASH");

        when(userRepository.findById("id")).thenReturn(Optional.of(u));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserInput input = mock(UpdateUserInput.class);

        when(input.firstName()).thenReturn(null);
        when(input.lastName()).thenReturn(null);
        when(input.email()).thenReturn(null);
        when(input.phone()).thenReturn(null);
        when(input.role()).thenReturn(null);
        when(input.poste()).thenReturn(null);
        when(input.avatarUrl()).thenReturn(null);

        when(input.password()).thenReturn(null);

        User resultNull = userService.updateUser("id", input);

        assertThat(resultNull.getPassword()).isEqualTo("OLD_HASH");
        verify(encoder, never()).encode(anyString());

        when(input.password()).thenReturn("   ");

        User resultBlank = userService.updateUser("id", input);

        assertThat(resultBlank.getPassword()).isEqualTo("OLD_HASH");
        verify(encoder, never()).encode(anyString());
    }

    @Test
    void completeFirstLogin_shouldSetFirstConnectionFalse_whenTrue() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        User u = new User();
        u.setId("userId");
        u.setFirstConnection(true);

        when(userRepository.findById("userId")).thenReturn(Optional.of(u));
        when(userRepository.save(u)).thenReturn(u);

        userService.completeFirstLogin("userId");

        assertThat(u.isFirstConnection()).isFalse();
        verify(userRepository).save(u);
    }

    @Test
    void completeFirstLogin_shouldNotSave_whenFirstConnectionAlreadyFalse() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        User u = new User();
        u.setId("userId");
        u.setFirstConnection(false);

        when(userRepository.findById("userId")).thenReturn(Optional.of(u));

        userService.completeFirstLogin("userId");

        verify(userRepository, never()).save(any());
    }

    @Test
    void completeFirstLogin_shouldThrow_whenUserNotFound() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = new UserService(userRepository, mock(PasswordEncoder.class));

        when(userRepository.findById("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.completeFirstLogin("unknown"))
                .isInstanceOf(EntityNotFoundException.class);
        verify(userRepository, never()).save(any());
    }
}
