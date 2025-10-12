package com.example.time_manager.controller;

import com.example.time_manager.dto.clock.ClockCreateRequest;
import com.example.time_manager.dto.clock.ClockRangeQuery;
import com.example.time_manager.dto.clock.ClockResponse;
import com.example.time_manager.service.ClockService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clocks")
public class ClockController {

    private final ClockService clockService;

    public ClockController(ClockService clockService) {
        this.clockService = clockService;
    }

    /** POST /api/clocks  — body: { "kind": "IN" | "OUT", "at": "ISO-8601" (optionnel) } */
    @PostMapping
    public ClockResponse createForMe(@RequestBody @Valid ClockCreateRequest req, Authentication auth) {
        return clockService.createForMe(auth.getName(), req);
    }

    /** POST /api/clocks/users/{userId} — MANAGER/ADMIN */
    @PostMapping("/users/{userId}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ClockResponse createForUser(@PathVariable String userId, @RequestBody @Valid ClockCreateRequest req) {
        return clockService.createForUser(userId, req);
    }

    /** GET /api/clocks/me[?from=&to=] */
    @GetMapping("/me")
    public List<ClockResponse> myClocks(@ModelAttribute ClockRangeQuery q, Authentication auth) {
        return clockService.listForEmail(auth.getName(), q.from, q.to);
    }

    /** GET /api/clocks/users/{userId}[?from=&to=] — MANAGER/ADMIN. */
    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public List<ClockResponse> listForUser(@PathVariable String userId, @ModelAttribute ClockRangeQuery q) {
        return clockService.listForUser(userId, q.from, q.to);
    }

    /* ============ Exception handlers ============ */

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> badPunch(IllegalStateException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Void> notFound(EntityNotFoundException ex) {
        return ResponseEntity.notFound().build();
    }
}
