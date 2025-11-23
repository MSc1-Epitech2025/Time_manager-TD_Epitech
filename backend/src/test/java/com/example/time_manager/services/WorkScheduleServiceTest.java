package com.example.time_manager.services;

import com.example.time_manager.dto.work_schedule.WorkScheduleBatchRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleRequest;
import com.example.time_manager.dto.work_schedule.WorkScheduleResponse;
import com.example.time_manager.model.WorkDay;
import com.example.time_manager.model.WorkPeriod;
import com.example.time_manager.model.WorkSchedule;
import com.example.time_manager.repository.WorkScheduleRepository;
import com.example.time_manager.service.WorkScheduleService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class WorkScheduleServiceTest {

    WorkScheduleRepository repo = mock(WorkScheduleRepository.class);
    WorkScheduleService service = new WorkScheduleService(repo);

    @Test
    void listForUser_shouldReturnMappedResponses() {
        WorkSchedule ws = makeSchedule("U1", WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");
        when(repo.findByUserId("U1")).thenReturn(List.of(ws));

        var res = service.listForUser("U1");

        assertThat(res).hasSize(1);
        assertThat(res.get(0).userId()).isEqualTo("U1");
    }

    @Test
    void upsertForUser_shouldCreateNew_whenNotExists() {
        WorkScheduleRequest req = new WorkScheduleRequest(WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");
        when(repo.findByUserIdAndDayOfWeekAndPeriod("U1", WorkDay.MON, WorkPeriod.AM))
                .thenReturn(Optional.empty());

        WorkSchedule saved = makeSchedule("U1", WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");
        saved.setId(1L);
        when(repo.save(any())).thenReturn(saved);

        WorkScheduleResponse res = service.upsertForUser("U1", req);

        assertThat(res.id()).isEqualTo("1");
        verify(repo).save(any());
    }

    @Test
    void upsertForUser_shouldUpdateExisting_whenExists() {
        WorkSchedule existing = makeSchedule("U1", WorkDay.MON, WorkPeriod.PM, "13:00", "17:00");
        when(repo.findByUserIdAndDayOfWeekAndPeriod("U1", WorkDay.MON, WorkPeriod.PM))
                .thenReturn(Optional.of(existing));
        when(repo.save(existing)).thenReturn(existing);

        WorkScheduleRequest req = new WorkScheduleRequest(WorkDay.MON, WorkPeriod.PM, "13:30", "17:30");

        var res = service.upsertForUser("U1", req);

        assertThat(res.startTime()).contains("13:30");
    }

    @Test
    void upsertForUser_shouldThrow_ifEndBeforeStart() {
        WorkScheduleRequest req = new WorkScheduleRequest(WorkDay.MON, WorkPeriod.AM, "10:00", "09:00");

        assertThatThrownBy(() -> service.upsertForUser("U1", req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("endTime must be strictly after startTime");
    }

    @Test
    void batchUpsertForUser_shouldThrow_ifEmptyBatch() {
        WorkScheduleBatchRequest batch = new WorkScheduleBatchRequest(List.of(), false);

        assertThatThrownBy(() -> service.batchUpsertForUser("U1", batch))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Batch entries cannot be empty");
    }

    @Test
    void batchUpsertForUser_shouldReplaceAll_whenReplaceAllTrue() {
        WorkScheduleRequest req = new WorkScheduleRequest(WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");
        WorkScheduleBatchRequest batch = new WorkScheduleBatchRequest(List.of(req), true);

        WorkSchedule saved = makeSchedule("U1", WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");
        when(repo.save(any())).thenReturn(saved);

        var res = service.batchUpsertForUser("U1", batch);

        assertThat(res).hasSize(1);
        verify(repo).deleteByUserId("U1");
        verify(repo).save(any());
    }

    @Test
    void batchUpsertForUser_shouldCallUpsert_whenReplaceAllFalse() {
        WorkScheduleRequest req = new WorkScheduleRequest(WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");
        WorkScheduleBatchRequest batch = new WorkScheduleBatchRequest(List.of(req), false);

        WorkSchedule saved = makeSchedule("U1", WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");
        when(repo.findByUserIdAndDayOfWeekAndPeriod("U1", WorkDay.MON, WorkPeriod.AM))
                .thenReturn(Optional.empty());
        when(repo.save(any())).thenReturn(saved);

        var res = service.batchUpsertForUser("U1", batch);

        assertThat(res).hasSize(1);
    }

    @Test
    void batchUpsertForUser_shouldThrow_ifInvalidTime() {
        WorkScheduleRequest bad = new WorkScheduleRequest(WorkDay.MON, WorkPeriod.AM, "10:00", "09:00");
        WorkScheduleBatchRequest batch = new WorkScheduleBatchRequest(List.of(bad), false);

        assertThatThrownBy(() -> service.batchUpsertForUser("U1", batch))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("endTime must be strictly after startTime");
    }

    @Test
    void deleteSlot_shouldDelete_whenExists() {
        WorkSchedule ws = makeSchedule("U1", WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");
        when(repo.findByUserIdAndDayOfWeekAndPeriod("U1", WorkDay.MON, WorkPeriod.AM))
                .thenReturn(Optional.of(ws));

        service.deleteSlot("U1", WorkDay.MON, WorkPeriod.AM);

        verify(repo).delete(ws);
    }

    @Test
    void deleteSlot_shouldThrow_whenNotFound() {
        when(repo.findByUserIdAndDayOfWeekAndPeriod("U1", WorkDay.MON, WorkPeriod.AM))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteSlot("U1", WorkDay.MON, WorkPeriod.AM))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("WorkSchedule slot not found");
    }

    @Test
    void parseTime_shouldHandleHHmm() throws Exception {
        var method = WorkScheduleService.class.getDeclaredMethod("parseTime", String.class);
        method.setAccessible(true);

        LocalTime t = (LocalTime) method.invoke(service, "08:00");

        assertThat(t).isEqualTo(LocalTime.of(8, 0));
    }

    @Test
    void parseTime_shouldThrow_ifNull() throws Exception {
        var method = WorkScheduleService.class.getDeclaredMethod("parseTime", String.class);
        method.setAccessible(true);

        assertThatThrownBy(() -> method.invoke(service, new Object[]{null}))
                .hasRootCauseInstanceOf(IllegalArgumentException.class)
                .hasRootCauseMessage("time cannot be null");
    }

    @Test
    void validateTimes_shouldThrow_ifEndBeforeStart() throws Exception {
        var method = WorkScheduleService.class.getDeclaredMethod("validateTimes", String.class, String.class);
        method.setAccessible(true);

        assertThatThrownBy(() -> method.invoke(service, "10:00", "09:00"))
                .hasRootCauseInstanceOf(IllegalArgumentException.class)
                .hasRootCauseMessage("endTime must be strictly after startTime (got 10:00 -> 09:00)");
    }

    @Test
    void toResponse_shouldMapCorrectly() throws Exception {
        var method = WorkScheduleService.class.getDeclaredMethod("toResponse", WorkSchedule.class);
        method.setAccessible(true);

        WorkSchedule ws = makeSchedule("U1", WorkDay.MON, WorkPeriod.AM, "08:00", "12:00");
        ws.setId(123L);

        WorkScheduleResponse r = (WorkScheduleResponse) method.invoke(service, ws);

        assertThat(r.id()).isEqualTo("123");
        assertThat(r.startTime()).contains("08:00");
    }

    @Test
    void batchUpsertForUser_shouldThrow_ifBatchNull() {
        assertThatThrownBy(() -> service.batchUpsertForUser("U1", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Batch entries cannot be empty");
    }

    @Test
    void batchUpsertForUser_shouldThrow_ifEntriesNull() {
        WorkScheduleBatchRequest batch = new WorkScheduleBatchRequest(null, false);

        assertThatThrownBy(() -> service.batchUpsertForUser("U1", batch))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Batch entries cannot be empty");
    }

    @Test
    void parseTime_shouldHandleHHmmss() throws Exception {
        var method = WorkScheduleService.class.getDeclaredMethod("parseTime", String.class);
        method.setAccessible(true);

        LocalTime t = (LocalTime) method.invoke(service, "08:00:30");

        assertThat(t).isEqualTo(LocalTime.of(8, 0, 30));
    }

    @Test
    void toResponse_shouldHandleNullTimes() throws Exception {
        var method = WorkScheduleService.class.getDeclaredMethod("toResponse", WorkSchedule.class);
        method.setAccessible(true);

        WorkSchedule ws = new WorkSchedule();
        ws.setId(10L);
        ws.setUserId("U1");
        ws.setDayOfWeek(WorkDay.MON);
        ws.setPeriod(WorkPeriod.AM);
        ws.setStartTime(null);
        ws.setEndTime(null);

        WorkScheduleResponse r = (WorkScheduleResponse) method.invoke(service, ws);

        assertThat(r.startTime()).isNull();
        assertThat(r.endTime()).isNull();
    }

    private static WorkSchedule makeSchedule(String userId, WorkDay day, WorkPeriod period, String start, String end) {
        WorkSchedule ws = new WorkSchedule();
        ws.setUserId(userId);
        ws.setDayOfWeek(day);
        ws.setPeriod(period);
        ws.setStartTime(LocalTime.parse(start + ":00"));
        ws.setEndTime(LocalTime.parse(end + ":00"));
        return ws;
    }
}
