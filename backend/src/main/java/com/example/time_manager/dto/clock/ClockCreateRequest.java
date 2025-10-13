package com.example.time_manager.dto.clock;

import java.time.Instant;
import com.example.time_manager.model.ClockKind;
import jakarta.validation.constraints.NotNull;

public record ClockCreateRequest(
        @NotNull ClockKind kind,
        Instant at
) {}
