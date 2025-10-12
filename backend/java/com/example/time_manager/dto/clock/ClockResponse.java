package com.example.time_manager.dto.clock;

import com.example.time_manager.model.ClockKind;
import java.time.Instant;

public class ClockResponse {
    public Long id;
    public String userId;
    public ClockKind kind;
    public Instant at;
}
