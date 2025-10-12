package com.example.time_manager.dto.clock;

import org.springframework.format.annotation.DateTimeFormat;
import java.time.Instant;

public class ClockRangeQuery {
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    public Instant from;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    public Instant to;
}
