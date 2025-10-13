package com.example.time_manager.service;

import com.example.time_manager.dto.clock.ClockCreateRequest;
import com.example.time_manager.dto.clock.ClockResponse;
import com.example.time_manager.model.Clock;
import com.example.time_manager.model.ClockKind;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.ClockRepository;
import com.example.time_manager.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class ClockService {

    private final ClockRepository clockRepo;
    private final UserRepository userRepo;

    public ClockService(ClockRepository clockRepo, UserRepository userRepo) {
        this.clockRepo = clockRepo;
        this.userRepo = userRepo;
    }

    /* ======================= CREATE ======================= */

    public ClockResponse createForMe(String email, ClockCreateRequest req) {
        return punch(email, req.kind(), null, req.at());
    }

    public ClockResponse createForUser(String userId, ClockCreateRequest req) {
        return punch(null, req.kind(), userId, req.at());
    }

    private ClockResponse punch(String email, ClockKind kind, String explicitUserId, Instant at) {
        final User user = (explicitUserId != null)
                ? userRepo.findById(explicitUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + explicitUserId))
                : userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));

        var last = clockRepo.findTopByUserIdOrderByAtDesc(user.getId());
        if (last.isPresent() && last.get().getKind() == kind) {
            throw new IllegalStateException("Cannot punch " + kind + " twice in a row");
        }

        Clock c = new Clock();
        c.setUser(user);
        c.setKind(kind);
        c.setAt(at != null ? at : Instant.now());

        c = clockRepo.save(c);
        return toDto(c);
    }

    /* ======================= READ ======================= */

    @Transactional(readOnly = true)
    public List<ClockResponse> listForEmail(String email, Instant from, Instant to) {
        String userId = userRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email))
                .getId();
        return listForUser(userId, from, to);
    }

    @Transactional(readOnly = true)
    public List<ClockResponse> listForUser(String userId, Instant from, Instant to) {
        List<Clock> rows;
        if (from != null && to != null) {
            rows = clockRepo.findByUserIdAndAtBetweenOrderByAtAsc(userId, from, to);
        } else {
            rows = clockRepo.findByUserIdOrderByAtDesc(userId);
        }
        return rows.stream().map(this::toDto).toList();
    }

    /* ======================= MAPPER ======================= */

    private ClockResponse toDto(Clock c) {
        ClockResponse r = new ClockResponse();
        r.id = c.getId();
        r.userId = c.getUser().getId();
        r.kind = c.getKind();
        r.at = c.getAt();
        return r;
    }
}
