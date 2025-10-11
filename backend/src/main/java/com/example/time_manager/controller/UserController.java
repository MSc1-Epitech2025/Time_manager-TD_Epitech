package com.example.time_manager.controller;

import com.example.time_manager.dto.*;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

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

  // ====== Lecture (admin/manager : liste ; un utilisateur peut lire son propre profil)
  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  public List<UserResponse> list() {
    return userRepo.findAll().stream().map(this::toResp).toList();
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or #id == authentication.name")
  public UserResponse getById(@PathVariable String id, Authentication auth) {
    var u = userRepo.findById(id).orElseThrow();
    // si non admin/manager, autoriser seulement si c'est le même user (par email vs id) :
    if (!auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().startsWith("ROLE_ADMIN") || a.getAuthority().startsWith("ROLE_MANAGER"))) {
      // tolère lecture si c'est lui-même (id match)
      if (!u.getEmail().equals(auth.getName())) {
        throw new org.springframework.security.access.AccessDeniedException("Forbidden");
      }
    }
    return toResp(u);
  }

  // ====== Création (ADMIN)
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
    var saved = userService.saveUser(entity); // encode le mot de passe
    var body = toResp(saved);
    return ResponseEntity.created(URI.create("/api/users/" + saved.getId())).body(body);
  }

  // ====== Mise à jour (ADMIN/MANAGER) — un user peut MAJ son propre profil basique (sans role)
  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or #id == authentication.name")
  public UserResponse update(@PathVariable String id, @RequestBody @Valid UserUpdateRequest req, Authentication auth) {
    var u = userRepo.findById(id).orElseThrow();
    // Si pas admin/manager, empêcher le changement de role et d'email d'autrui
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
      // reset par admin/manager
      u.setPassword(req.password);
      u = userService.saveUser(u); // ré-encode
    } else {
      u = userRepo.save(u);
    }
    return toResp(u);
  }

  // ====== Changement de mot de passe par l'utilisateur
  @PatchMapping("/me/password")
  public ResponseEntity<Void> changePassword(@RequestBody @Valid PasswordChangeRequest req, Authentication auth) {
    userService.changePassword(auth.getName(), req.currentPassword, req.newPassword);
    return ResponseEntity.noContent().build();
  }

  // ====== Suppression (ADMIN)
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
