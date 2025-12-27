package com.example.time_manager.services;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.time_manager.dto.clock.ClockCreateRequest;
import com.example.time_manager.dto.clock.ClockResponse;
import com.example.time_manager.model.Clock;
import com.example.time_manager.model.ClockKind;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.ClockRepository;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.AutoReportService;
import com.example.time_manager.service.ClockService;

import jakarta.persistence.EntityNotFoundException;

class ClockServiceTest {

    ClockRepository clockRepo = mock(ClockRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    AutoReportService autoReportService = mock(AutoReportService.class);

    ClockService service = new ClockService(clockRepo, userRepo, autoReportService);

    @Test
    void createForMe_shouldPunchSuccessfully() {
        User user = new User();
        user.setId("U1");

        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(user));
        when(clockRepo.findTopByUser_IdOrderByAtDescIdDesc("U1")).thenReturn(Optional.empty());

        Clock saved = new Clock();
        saved.setId(1L);
        saved.setUser(user);
        saved.setKind(ClockKind.IN);
        saved.setAt(Instant.parse("2025-01-01T10:00:00Z"));
        when(clockRepo.save(any(Clock.class))).thenReturn(saved);

        // appelé après save() pour reconstruire dayClocks
        when(clockRepo.findByUser_IdAndAtBetweenOrderByAtAsc(eq("U1"), any(), any()))
                .thenReturn(List.of(saved));

        ClockCreateRequest req = new ClockCreateRequest(ClockKind.IN, saved.getAt());
        ClockResponse res = service.createForMe("me@test.com", req);

        assertThat(res.id).isEqualTo(1L);
        assertThat(res.kind).isEqualTo(ClockKind.IN);

        verify(clockRepo).save(any(Clock.class));
        verify(autoReportService).onClockCreated(eq("U1"), eq(ClockKind.IN), eq(saved.getAt()), anyList());
    }

    @Test
    void createForUser_shouldPunchSuccessfully() {
        User user = new User();
        user.setId("U99");

        when(userRepo.findById("U99")).thenReturn(Optional.of(user));
        when(clockRepo.findTopByUser_IdOrderByAtDescIdDesc("U99")).thenReturn(Optional.empty());

        Clock saved = new Clock();
        saved.setId(5L);
        saved.setUser(user);
        saved.setKind(ClockKind.OUT);
        saved.setAt(Instant.parse("2025-01-01T11:00:00Z"));
        when(clockRepo.save(any(Clock.class))).thenReturn(saved);

        when(clockRepo.findByUser_IdAndAtBetweenOrderByAtAsc(eq("U99"), any(), any()))
                .thenReturn(List.of(saved));

        ClockCreateRequest req = new ClockCreateRequest(ClockKind.OUT, null);
        ClockResponse res = service.createForUser("U99", req);

        assertThat(res.id).isEqualTo(5L);
        assertThat(res.userId).isEqualTo("U99");
        assertThat(res.kind).isEqualTo(ClockKind.OUT);

        verify(autoReportService).onClockCreated(eq("U99"), eq(ClockKind.OUT), eq(saved.getAt()), anyList());
    }

    @Test
    void punch_shouldThrow_whenUserNotFoundByEmail() {
        when(userRepo.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        ClockCreateRequest req = new ClockCreateRequest(ClockKind.IN, Instant.now());
        assertThatThrownBy(() -> service.createForMe("ghost@test.com", req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void punch_shouldThrow_whenUserNotFoundById() {
        when(userRepo.findById("X")).thenReturn(Optional.empty());

        ClockCreateRequest req = new ClockCreateRequest(ClockKind.IN, Instant.now());
        assertThatThrownBy(() -> service.createForUser("X", req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void punch_shouldThrow_whenSameKindTwice() {
        User user = new User();
        user.setId("U1");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(user));

        Clock last = new Clock();
        last.setKind(ClockKind.IN);
        when(clockRepo.findTopByUser_IdOrderByAtDescIdDesc("U1")).thenReturn(Optional.of(last));

        ClockCreateRequest req = new ClockCreateRequest(ClockKind.IN, Instant.now());

        assertThatThrownBy(() -> service.createForMe("me@test.com", req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot punch IN twice in a row");

        verify(clockRepo, never()).save(any());
        verify(autoReportService, never()).onClockCreated(anyString(), any(), any(), anyList());
    }

    @Test
    void punch_shouldAllow_whenLastKindIsDifferent() {
        User user = new User();
        user.setId("U1");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(user));

        Clock last = new Clock();
        last.setKind(ClockKind.OUT);
        when(clockRepo.findTopByUser_IdOrderByAtDescIdDesc("U1")).thenReturn(Optional.of(last));

        Clock saved = new Clock();
        saved.setId(10L);
        saved.setUser(user);
        saved.setKind(ClockKind.IN);
        saved.setAt(Instant.parse("2025-01-01T09:00:00Z"));
        when(clockRepo.save(any())).thenReturn(saved);

        when(clockRepo.findByUser_IdAndAtBetweenOrderByAtAsc(eq("U1"), any(), any()))
                .thenReturn(List.of(saved));

        ClockCreateRequest req = new ClockCreateRequest(ClockKind.IN, null);
        ClockResponse res = service.createForMe("me@test.com", req);

        assertThat(res.id).isEqualTo(10L);
        assertThat(res.kind).isEqualTo(ClockKind.IN);
        verify(autoReportService).onClockCreated(eq("U1"), eq(ClockKind.IN), eq(saved.getAt()), anyList());
    }

    @Test
    void listForEmail_shouldReturnClockResponses() {
        User u = new User();
        u.setId("U2");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(u));

        Clock c = new Clock();
        c.setId(1L);
        c.setUser(u);
        c.setKind(ClockKind.IN);
        c.setAt(Instant.now());

        when(clockRepo.findByUser_IdOrderByAtDesc("U2")).thenReturn(List.of(c));

        var res = service.listForEmail("me@test.com", null, null);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).id).isEqualTo(1L);
    }

    @Test
    void listForEmail_shouldThrow_whenUserNotFound() {
        when(userRepo.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.listForEmail("ghost@test.com", null, null))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void listForUser_shouldUseBetween_whenDatesProvided() {
        Clock c = new Clock();
        User u = new User();
        u.setId("U3");
        c.setUser(u);
        c.setId(3L);

        when(clockRepo.findByUser_IdAndAtBetweenOrderByAtAsc(anyString(), any(), any()))
                .thenReturn(List.of(c));

        var res = service.listForUser("U3", Instant.now().minusSeconds(10), Instant.now());

        assertThat(res).hasSize(1);
        assertThat(res.get(0).id).isEqualTo(3L);
        verify(clockRepo).findByUser_IdAndAtBetweenOrderByAtAsc(eq("U3"), any(), any());
    }

    @Test
    void listForUser_shouldUseOrderByDesc_whenNoDates() {
        Clock c = new Clock();
        User u = new User();
        u.setId("U3");
        c.setUser(u);
        c.setId(7L);

        when(clockRepo.findByUser_IdOrderByAtDesc("U3")).thenReturn(List.of(c));

        var res = service.listForUser("U3", null, null);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).id).isEqualTo(7L);
        verify(clockRepo).findByUser_IdOrderByAtDesc("U3");
    }

    @Test
    void listForUser_fromOnly_shouldUseOrderByDesc() {
        Clock c = new Clock();
        User u = new User();
        u.setId("U3");
        c.setUser(u);
        c.setId(99L);

        when(clockRepo.findByUser_IdOrderByAtDesc("U3")).thenReturn(List.of(c));

        var res = service.listForUser("U3", Instant.now(), null);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).id).isEqualTo(99L);
        verify(clockRepo).findByUser_IdOrderByAtDesc("U3");
    }

    @Test
    void listForUser_toOnly_shouldUseOrderByDesc() {
        Clock c = new Clock();
        User u = new User();
        u.setId("U3");
        c.setUser(u);
        c.setId(77L);

        when(clockRepo.findByUser_IdOrderByAtDesc("U3")).thenReturn(List.of(c));

        var res = service.listForUser("U3", null, Instant.now());

        assertThat(res).hasSize(1);
        assertThat(res.get(0).id).isEqualTo(77L);
        verify(clockRepo).findByUser_IdOrderByAtDesc("U3");
    }

    @Test
    void toDto_shouldMapAllFields() throws Exception {
        User u = new User();
        u.setId("U10");

        Clock c = new Clock();
        c.setId(11L);
        c.setUser(u);
        c.setKind(ClockKind.OUT);
        c.setAt(Instant.parse("2025-01-01T00:00:00Z"));

        var method = ClockService.class.getDeclaredMethod("toDto", Clock.class);
        method.setAccessible(true);

        ClockResponse r = (ClockResponse) method.invoke(service, c);

        assertThat(r.id).isEqualTo(11L);
        assertThat(r.userId).isEqualTo("U10");
        assertThat(r.kind).isEqualTo(ClockKind.OUT);
        assertThat(r.at).isEqualTo(Instant.parse("2025-01-01T00:00:00Z"));
    }
}
