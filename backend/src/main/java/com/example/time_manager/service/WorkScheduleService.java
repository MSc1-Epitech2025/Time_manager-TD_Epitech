package com.example.time_manager.service;

import com.example.time_manager.dto.work_schedule.WorkScheduleBatchRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleResponse;
import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;
import com.example.time_manager.model.WorkSchedule;
import com.example.time_manager.repository.WorkScheduleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class WorkScheduleService {

    private final WorkScheduleRepository repo;

    public WorkScheduleService(WorkScheduleRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<WorkScheduleResponse> listForUser(String userId) {
        List<WorkSchedule> list = repo.findByUserId(userId);
        return list.stream().map(this::toResponse).toList();
    }


    /* ======================== MUTATIONS ======================== */
    public WorkScheduleResponse upsertForUser(String userId, WorkScheduleRequest input) {
        validateTimes(input.startTime(), input.endTime());

        Optional<WorkSchedule> existing
                = repo.findByUserIdAndDayOfWeekAndPeriod(userId, input.dayOfWeek(), input.period());

        WorkSchedule entity = existing.orElseGet(() -> {
            WorkSchedule ws = new WorkSchedule();
            ws.setUserId(userId);
            ws.setDayOfWeek(input.dayOfWeek());
            ws.setPeriod(input.period());
            return ws;
        });

        entity.setStartTime(parseTime(input.startTime()));
        entity.setEndTime(parseTime(input.endTime()));

        WorkSchedule saved = repo.save(entity);
        return toResponse(saved);
    }

    public List<WorkScheduleResponse> batchUpsertForUser(String userId, WorkScheduleBatchRequest batch) {
        if (batch == null || batch.entries() == null || batch.entries().isEmpty()) {
            throw new IllegalArgumentException("Batch entries cannot be empty");
        }

        batch.entries().forEach(e -> validateTimes(e.startTime(), e.endTime()));

        List<WorkScheduleResponse> result = new ArrayList<>();

        if (Boolean.TRUE.equals(batch.replaceAll())) {
            repo.deleteByUserId(userId);
            for (WorkScheduleRequest e : batch.entries()) {
                WorkSchedule ws = new WorkSchedule();
                ws.setUserId(userId);
                ws.setDayOfWeek(e.dayOfWeek());
                ws.setPeriod(e.period());
                ws.setStartTime(parseTime(e.startTime()));
                ws.setEndTime(parseTime(e.endTime()));
                result.add(toResponse(repo.save(ws)));
            }
        } else {
            for (WorkScheduleRequest e : batch.entries()) {
                result.add(upsertForUser(userId, e));
            }
        }

        return result;
    }

    public void deleteSlot(String userId, WorkDay day, WorkPeriod period) {
        Optional<WorkSchedule> existing = repo.findByUserIdAndDayOfWeekAndPeriod(userId, day, period);
        if (existing.isEmpty()) {
            throw new EntityNotFoundException("WorkSchedule slot not found for user=" + userId
                    + ", day=" + day + ", period=" + period);
        }
        repo.delete(existing.get());
    }


    /* ======================== Helpers ======================== */
    private void validateTimes(String start, String end) {
        LocalTime s = parseTime(start);
        LocalTime e = parseTime(end);
        if (!e.isAfter(s)) {
            throw new IllegalArgumentException("endTime must be strictly after startTime (got %s -> %s)".formatted(start, end));
        }
    }

    private LocalTime parseTime(String time) {
        if (time == null) {
            throw new IllegalArgumentException("time cannot be null");
        }
        if (time.length() == 5) {
            return LocalTime.parse(time + ":00");
        }
        return LocalTime.parse(time);
    }

    private WorkScheduleResponse toResponse(WorkSchedule ws) {
        String start = ws.getStartTime() != null ? ws.getStartTime().withSecond(0).toString() : null;
        String end = ws.getEndTime() != null ? ws.getEndTime().withSecond(0).toString() : null;

        return new WorkScheduleResponse(
                String.valueOf(ws.getId()),
                ws.getUserId(),
                ws.getDayOfWeek(),
                ws.getPeriod(),
                start,
                end
        );
    }
}
