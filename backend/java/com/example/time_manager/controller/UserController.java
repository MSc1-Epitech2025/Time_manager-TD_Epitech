package com.example.time_manager.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.time_manager.dto.user.PasswordChangeRequest;
import com.example.time_manager.dto.user.UserCreateRequest;
import com.example.time_manager.dto.user.UserResponse;
import com.example.time_manager.dto.user.UserUpdateRequest;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

  private final UserRepository userRepo;
  private final UserService userService;

  public UserController(UserRepository userRepo, UserService userService) {
    this.userRepo = userRepo;
    this.userService = userService;
  }

  // ====== Profil courant
  @GetMapping("/me")
  public UserResponse me(Authentication auth) {
    var u = userRepo.findByEmail(auth.getName()).orElseThrow();
    return toResp(u);
  }

  // ====== READ (admin/manager)
  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public List<UserResponse> list() {
    return userRepo.findAll().stream().map(this::toResp).toList();
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or #id == authentication.name")
  public UserResponse getById(@PathVariable String id, Authentication auth) {
    var u = userRepo.findById(id).orElseThrow();
    if (!auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().startsWith("ROLE_ADMIN") || a.getAuthority().startsWith("ROLE_MANAGER"))) {
      if (!u.getEmail().equals(auth.getName())) {
        throw new org.springframework.security.access.AccessDeniedException("Forbidden");
      }
    }
    return toResp(u);
  }

  // ====== Create (ADMIN)
  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<UserResponse> create(@RequestBody @Valid UserCreateRequest req) {
    var entity = new User();
    entity.setFirstName(req.firstName);
    entity.setLastName(req.lastName);
    entity.setEmail(req.email);
    entity.setPhone(req.phone);
    entity.setRole(req.role != null && !req.role.isBlank() ? req.role : "[\"employee\"]");
    entity.setPoste(req.poste);
    entity.setPassword(req.password);
    var saved = userService.saveUser(entity);
    var body = toResp(saved);
    return ResponseEntity.created(URI.create("/api/users/" + saved.getId())).body(body);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or #id == authentication.name")
  public UserResponse update(@PathVariable String id, @RequestBody @Valid UserUpdateRequest req, Authentication auth) {
    var u = userRepo.findById(id).orElseThrow();
    var isPrivileged = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().matches("ROLE_(ADMIN|MANAGER)"));
    if (!isPrivileged && !u.getEmail().equals(auth.getName())) {
      throw new org.springframework.security.access.AccessDeniedException("Forbidden");
    }

    if (req.firstName != null) u.setFirstName(req.firstName);
    if (req.lastName != null)  u.setLastName(req.lastName);
    if (req.email != null && isPrivileged) u.setEmail(req.email);
    if (req.phone != null) u.setPhone(req.phone);
    if (req.poste != null) u.setPoste(req.poste);
    if (req.role != null && isPrivileged) u.setRole(req.role);
    if (req.password != null && !req.password.isBlank()) {
      u.setPassword(req.password);
      u = userService.saveUser(u);
    } else {
      u = userRepo.save(u);
    }
    return toResp(u);
  }

  // ====== User change their own password
  @PatchMapping("/me/password")
  public ResponseEntity<Void> changePassword(@RequestBody @Valid PasswordChangeRequest req, Authentication auth) {
    userService.changePassword(auth.getName(), req.currentPassword, req.newPassword);
    return ResponseEntity.noContent().build();
  }

  // ====== Delete (ADMIN)
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    userRepo.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  private UserResponse toResp(User u){
    var dto = new UserResponse();
    dto.id = u.getId();
    dto.firstName = u.getFirstName();
    dto.lastName = u.getLastName();
    dto.email = u.getEmail();
    dto.phone = u.getPhone();
    dto.role = u.getRole();
    dto.poste = u.getPoste();
    return dto;
  }
}
