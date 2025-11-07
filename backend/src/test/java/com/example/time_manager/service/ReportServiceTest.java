package com.example.time_manager.service;

import com.example.time_manager.dto.report.ReportCreateRequest;
import com.example.time_manager.dto.report.ReportResponse;
import com.example.time_manager.dto.report.ReportUpdateRequest;
import com.example.time_manager.model.Report;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.ReportRepository;
import com.example.time_manager.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ReportServiceTest {

    ReportRepository reportRepo = mock(ReportRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    ReportService service = new ReportService(reportRepo, userRepo);

    @Test
    void createForAuthorEmail_shouldCreateSuccessfully() {
        User author = makeUser("A1", "author@test.com", "[\"EMPLOYEE\"]");
        User target = makeUser("T1", "target@test.com", "[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("author@test.com")).thenReturn(Optional.of(author));
        when(userRepo.findById("T1")).thenReturn(Optional.of(target));

        Report saved = new Report();
        saved.setId(1L);
        saved.setAuthor(author);
        saved.setTarget(target);
        saved.setTitle("Test");
        saved.setBody("Body");
        when(reportRepo.save(any(Report.class))).thenReturn(saved);

        ReportCreateRequest req = new ReportCreateRequest();
        req.setTargetUserId("T1");
        req.setTitle("Test");
        req.setBody("Body");

        ReportResponse res = service.createForAuthorEmail("author@test.com", req);
        assertThat(res.id).isEqualTo(1L);
        assertThat(res.authorEmail).isEqualTo("author@test.com");
    }

    @Test
    void createForAuthorEmail_shouldThrow_whenAuthorNotFound() {
        when(userRepo.findByEmail("ghost@test.com")).thenReturn(Optional.empty());
        ReportCreateRequest req = new ReportCreateRequest();
        req.setTargetUserId("T1");
        assertThatThrownBy(() -> service.createForAuthorEmail("ghost@test.com", req))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void createForAuthorEmail_shouldThrow_whenTargetNotFound() {
        User author = makeUser("A1", "a@test.com", "[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("a@test.com")).thenReturn(Optional.of(author));
        when(userRepo.findById("T1")).thenReturn(Optional.empty());
        ReportCreateRequest req = new ReportCreateRequest();
        req.setTargetUserId("T1");
        assertThatThrownBy(() -> service.createForAuthorEmail("a@test.com", req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Target user not found");
    }

    @Test
    void listAllForAdmin_shouldReturnAll() {
        Report r = makeReport(1L);
        when(reportRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(r));
        var res = service.listAllForAdmin();
        assertThat(res).hasSize(1);
        assertThat(res.get(0).id).isEqualTo(1L);
    }

    @Test
    void listAuthoredByEmail_shouldReturnReports() {
        User u = makeUser("U1", "me@test.com", "[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(u));
        Report r = makeReport(2L);
        when(reportRepo.findByAuthor_IdOrderByCreatedAtDesc("U1")).thenReturn(List.of(r));
        var res = service.listAuthoredByEmail("me@test.com");
        assertThat(res).hasSize(1);
    }

    @Test
    void listReceivedByEmail_shouldReturnReports() {
        User u = makeUser("U2", "me@test.com", "[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(u));
        Report r = makeReport(3L);
        when(reportRepo.findByTarget_IdOrderByCreatedAtDesc("U2")).thenReturn(List.of(r));
        var res = service.listReceivedByEmail("me@test.com");
        assertThat(res).hasSize(1);
    }

    @Test
    void getVisibleTo_shouldReturnForAdmin() {
        User admin = makeUser("ADM", "admin@test.com", "[\"ADMIN\"]");
        Report r = makeReport(4L);
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        when(reportRepo.findById(4L)).thenReturn(Optional.of(r));

        var res = service.getVisibleTo("admin@test.com", 4L);
        assertThat(res.id).isEqualTo(4L);
    }

    @Test
    void getVisibleTo_shouldReturnForAuthorOrTarget() {
        User author = makeUser("A1", "a@test.com", "[\"EMPLOYEE\"]");
        User target = makeUser("T1", "t@test.com", "[\"EMPLOYEE\"]");
        Report r = makeReport(5L);
        r.setAuthor(author);
        r.setTarget(target);

        when(reportRepo.findById(5L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("a@test.com")).thenReturn(Optional.of(author));
        assertThat(service.getVisibleTo("a@test.com", 5L)).isNotNull();

        when(userRepo.findByEmail("t@test.com")).thenReturn(Optional.of(target));
        assertThat(service.getVisibleTo("t@test.com", 5L)).isNotNull();
    }

    @Test
    void getVisibleTo_shouldThrow_ifForbidden() {
        User u = makeUser("U1", "u@test.com", "[\"EMPLOYEE\"]");
        Report r = makeReport(9L);
        when(reportRepo.findById(9L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));
        assertThatThrownBy(() -> service.getVisibleTo("u@test.com", 9L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateVisibleTo_shouldAllowAdmin() {
        User admin = makeUser("ADM", "admin@test.com", "[\"ADMIN\"]");
        Report r = makeReport(10L);
        when(reportRepo.findById(10L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        when(reportRepo.save(any())).thenReturn(r);

        ReportUpdateRequest req = new ReportUpdateRequest();
        req.setTitle("NewTitle");
        req.setBody("NewBody");

        var res = service.updateVisibleTo("admin@test.com", 10L, req);
        assertThat(res.title).isEqualTo("NewTitle");
    }

    @Test
    void updateVisibleTo_shouldAllowAuthorAndChangeTarget() {
        User author = makeUser("A1", "a@test.com", "[\"EMPLOYEE\"]");
        User target = makeUser("T2", "t2@test.com", "[\"EMPLOYEE\"]");

        Report r = makeReport(11L);
        r.setAuthor(author);
        when(reportRepo.findById(11L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("a@test.com")).thenReturn(Optional.of(author));
        when(userRepo.findById("T2")).thenReturn(Optional.of(target));
        when(reportRepo.save(any())).thenReturn(r);

        ReportUpdateRequest req = new ReportUpdateRequest();
        req.setTargetUserId("T2");
        var res = service.updateVisibleTo("a@test.com", 11L, req);
        assertThat(res.targetUserId).isEqualTo("T2");
    }

    @Test
    void updateVisibleTo_shouldThrow_ifNotAllowed() {
        User u = makeUser("U", "u@test.com", "[\"EMPLOYEE\"]");
        Report r = makeReport(12L);
        r.setAuthor(makeUser("A1", "a@test.com", "[\"EMPLOYEE\"]"));
        when(reportRepo.findById(12L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));

        Throwable thrown = catchThrowable(() ->
                service.updateVisibleTo("u@test.com", 12L, new ReportUpdateRequest()));

        assertThat(thrown)
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Forbidden");
    }

    @Test
    void updateVisibleTo_shouldThrow_ifTargetNotFound() {
        User author = makeUser("A1", "a@test.com", "[\"EMPLOYEE\"]");
        Report r = makeReport(13L);
        r.setAuthor(author);
        when(reportRepo.findById(13L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("a@test.com")).thenReturn(Optional.of(author));
        when(userRepo.findById("T99")).thenReturn(Optional.empty());

        ReportUpdateRequest req = new ReportUpdateRequest();
        req.setTargetUserId("T99");

        assertThatThrownBy(() -> service.updateVisibleTo("a@test.com", 13L, req))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void deleteVisibleTo_shouldAllowAdmin() {
        User admin = makeUser("ADM", "admin@test.com", "[\"ADMIN\"]");
        Report r = makeReport(14L);
        when(reportRepo.findById(14L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        service.deleteVisibleTo("admin@test.com", 14L);
        verify(reportRepo).deleteById(14L);
    }

    @Test
    void deleteVisibleTo_shouldAllowAuthor() {
        User author = makeUser("A1", "a@test.com", "[\"EMPLOYEE\"]");
        Report r = makeReport(15L);
        r.setAuthor(author);
        when(reportRepo.findById(15L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("a@test.com")).thenReturn(Optional.of(author));

        service.deleteVisibleTo("a@test.com", 15L);
        verify(reportRepo).deleteById(15L);
    }

    @Test
    void deleteVisibleTo_shouldThrow_ifForbidden() {
        User u = makeUser("U1", "u@test.com", "[\"EMPLOYEE\"]");
        Report r = makeReport(16L);
        r.setAuthor(makeUser("A2", "a@test.com", "[\"EMPLOYEE\"]"));
        when(reportRepo.findById(16L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));

        assertThatThrownBy(() -> service.deleteVisibleTo("u@test.com", 16L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void deleteVisibleTo_shouldThrow_ifReportNotFound() {
        when(reportRepo.findById(99L)).thenReturn(Optional.empty());
        when(userRepo.findByEmail("x@test.com")).thenReturn(Optional.of(makeUser("X", "x@test.com", "[\"EMPLOYEE\"]")));
        assertThatThrownBy(() -> service.deleteVisibleTo("x@test.com", 99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    private static User makeUser(String id, String email, String role) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setRole(role);
        return u;
    }

    private static Report makeReport(Long id) {
        User author = makeUser("AUTH", "author@test.com", "[\"EMPLOYEE\"]");
        User target = makeUser("TARG", "target@test.com", "[\"EMPLOYEE\"]");
        Report r = new Report();
        r.setId(id);
        r.setAuthor(author);
        r.setTarget(target);
        r.setTitle("Title");
        r.setBody("Body");
        r.setCreatedAt(Instant.now());
        return r;
    }
}
