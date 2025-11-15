package com.example.time_manager.services;

import com.example.time_manager.dto.clock.ClockCreateRequest;
import com.example.time_manager.dto.clock.ClockResponse;
import com.example.time_manager.model.Clock;
import com.example.time_manager.model.ClockKind;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.ClockRepository;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.ClockService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ClockServiceTest {

    ClockRepository clockRepo = mock(ClockRepository.class);
    UserRepository userRepo = mock(UserRepository.class);

    ClockService service = new ClockService(clockRepo, userRepo);

    @Test
    void createForMe_shouldPunchSuccessfully() {
        User user = new User();
        user.setId("U1");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(user));
        when(clockRepo.findTopByUserIdOrderByAtDesc("U1")).thenReturn(Optional.empty());

        Clock c = new Clock();
        c.setId(1L);
        c.setUser(user);
        c.setKind(ClockKind.IN);
        c.setAt(Instant.parse("2025-01-01T10:00:00Z"));
        when(clockRepo.save(any(Clock.class))).thenReturn(c);

        ClockCreateRequest req = new ClockCreateRequest(ClockKind.IN, Instant.parse("2025-01-01T10:00:00Z"));
        ClockResponse res = service.createForMe("me@test.com", req);

        assertThat(res.id).isEqualTo(1L);
        assertThat(res.kind).isEqualTo(ClockKind.IN);
        verify(clockRepo).save(any(Clock.class));
    }

    @Test
    void createForUser_shouldPunchSuccessfully() {
        User user = new User();
        user.setId("U99");
        when(userRepo.findById("U99")).thenReturn(Optional.of(user));
        when(clockRepo.findTopByUserIdOrderByAtDesc("U99")).thenReturn(Optional.empty());

        Clock c = new Clock();
        c.setId(5L);
        c.setUser(user);
        c.setKind(ClockKind.OUT);
        c.setAt(Instant.now());
        when(clockRepo.save(any(Clock.class))).thenReturn(c);

        ClockCreateRequest req = new ClockCreateRequest(ClockKind.OUT, null);
        ClockResponse res = service.createForUser("U99", req);

        assertThat(res.id).isEqualTo(5L);
        assertThat(res.userId).isEqualTo("U99");
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
        when(clockRepo.findTopByUserIdOrderByAtDesc("U1")).thenReturn(Optional.of(last));

        ClockCreateRequest req = new ClockCreateRequest(ClockKind.IN, Instant.now());
        assertThatThrownBy(() -> service.createForMe("me@test.com", req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot punch IN twice in a row");
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
        when(clockRepo.findByUserIdOrderByAtDesc("U2")).thenReturn(List.of(c));

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
        when(clockRepo.findByUserIdAndAtBetweenOrderByAtAsc(anyString(), any(), any()))
                .thenReturn(List.of(c));

        var res = service.listForUser("U3", Instant.now().minusSeconds(10), Instant.now());
        assertThat(res).hasSize(1);
        assertThat(res.get(0).id).isEqualTo(3L);
    }

    @Test
    void listForUser_shouldUseOrderByDesc_whenNoDates() {
        Clock c = new Clock();
        User u = new User();
        u.setId("U3");
        c.setUser(u);
        c.setId(7L);
        when(clockRepo.findByUserIdOrderByAtDesc("U3")).thenReturn(List.of(c));

        var res = service.listForUser("U3", null, null);
        assertThat(res).hasSize(1);
        assertThat(res.get(0).id).isEqualTo(7L);
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
    }

    @Test
    void listForUser_fromOnly_shouldUseOrderByDesc() {
        Clock c = new Clock();
        User u = new User();
        u.setId("U3");
        c.setUser(u);
        c.setId(99L);

        when(clockRepo.findByUserIdOrderByAtDesc("U3")).thenReturn(List.of(c));

        var res = service.listForUser("U3", Instant.now(), null);

        assertThat(res).hasSize(1);
        assertThat(res.get(0).id).isEqualTo(99L);
        verify(clockRepo).findByUserIdOrderByAtDesc("U3");
    }

    @Test
    void listForUser_toOnly_shouldUseOrderByDesc() {
        Clock c = new Clock();
        User u = new User();
        u.setId("U3");
        c.setUser(u);
        c.setId(77L);

        when(clockRepo.findByUserIdOrderByAtDesc("U3")).thenReturn(List.of(c));

        var res = service.listForUser("U3", null, Instant.now());

        assertThat(res).hasSize(1);
        assertThat(res.get(0).id).isEqualTo(77L);
        verify(clockRepo).findByUserIdOrderByAtDesc("U3");
    }

    @Test
    void punch_shouldAllow_whenLastKindIsDifferent() {
        User user = new User();
        user.setId("U1");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(user));

        Clock last = new Clock();
        last.setKind(ClockKind.OUT); // last != new punch kind
        when(clockRepo.findTopByUserIdOrderByAtDesc("U1")).thenReturn(Optional.of(last));

        Clock saved = new Clock();
        saved.setId(10L);
        saved.setUser(user);
        saved.setKind(ClockKind.IN);
        saved.setAt(Instant.now());
        when(clockRepo.save(any())).thenReturn(saved);

        ClockCreateRequest req = new ClockCreateRequest(ClockKind.IN, null);
        ClockResponse res = service.createForMe("me@test.com", req);

        assertThat(res.id).isEqualTo(10L);
        assertThat(res.kind).isEqualTo(ClockKind.IN);
    }
}
