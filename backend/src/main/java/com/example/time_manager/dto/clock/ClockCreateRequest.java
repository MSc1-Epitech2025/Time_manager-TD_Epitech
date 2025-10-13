package com.example.time_manager.dto.clock;
import java.time.Instant;
import com.example.time_manager.model.ClockKind;
import jakarta.validation.constraints.NotNull;

public class ClockCreateRequest {
    @NotNull
    public ClockKind kind;     // IN or OUT
    public Instant at;         // optional, IF null => now
}
