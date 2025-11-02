package com.example.time_manager.dto.work_schedule;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record WorkScheduleBatchRequest(
        @NotEmpty List<WorkScheduleRequest> entries,
        Boolean replaceAll
) {}
