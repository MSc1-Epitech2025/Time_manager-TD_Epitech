package com.example.time_manager.graphql.controller;

import com.example.time_manager.dto.clock.ClockCreateRequest;
import com.example.time_manager.dto.clock.ClockResponse;
import com.example.time_manager.service.ClockService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.List;

@Controller
public class ClockGraphQLController {

    private final ClockService clockService;

    public ClockGraphQLController(ClockService clockService) {
        this.clockService = clockService;
    }

    // === QUERIES ===
    @QueryMapping
    public List<ClockResponse> myClocks(
            @Argument String from,
            @Argument String to,
            Authentication auth
    ) {
        Instant fromInstant = from != null ? Instant.parse(from) : null;
        Instant toInstant = to != null ? Instant.parse(to) : null;
        return clockService.listForEmail(auth.getName(), fromInstant, toInstant);
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @QueryMapping
    public List<ClockResponse> clocksForUser(
            @Argument String userId,
            @Argument String from,
            @Argument String to
    ) {
        Instant fromInstant = from != null ? Instant.parse(from) : null;
        Instant toInstant = to != null ? Instant.parse(to) : null;
        return clockService.listForUser(userId, fromInstant, toInstant);
    }

    // === MUTATIONS ===
    @MutationMapping
    public ClockResponse createClockForMe(
            @Argument ClockCreateRequest input,
            Authentication auth
    ) {
        return clockService.createForMe(auth.getName(), input);
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @MutationMapping
    public ClockResponse createClockForUser(
            @Argument String userId,
            @Argument ClockCreateRequest input
    ) {
        return clockService.createForUser(userId, input);
    }

    // === EXCEPTIONS ===
    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalStateException.class)
    public String handleIllegalState(IllegalStateException ex) {
        return "Erreur: " + ex.getMessage();
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(EntityNotFoundException.class)
    public String handleNotFound(EntityNotFoundException ex) {
        return "Not found";
    }
}
