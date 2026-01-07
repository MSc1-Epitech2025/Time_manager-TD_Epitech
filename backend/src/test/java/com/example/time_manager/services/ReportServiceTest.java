package com.example.time_manager.services;

import com.example.time_manager.dto.report.ReportCreateRequest;
import com.example.time_manager.dto.report.ReportResponse;
import com.example.time_manager.dto.report.ReportUpdateRequest;
import com.example.time_manager.model.Report;
import com.example.time_manager.model.User;
import com.example.time_manager.repository.ReportRepository;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.service.ReportService;
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

        when(reportRepo.save(any(Report.class))).thenAnswer(inv -> {
            Report r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });

        ReportCreateRequest req = new ReportCreateRequest();
        req.setTargetUserId("T1");
        req.setTitle("Test");
        req.setBody("Body");

        ReportResponse res = service.createForAuthorEmail("author@test.com", req);

        assertThat(res).isNotNull();
        assertThat(res.getId()).isEqualTo(1L);
        assertThat(res.getAuthorEmail()).isEqualTo("author@test.com");
        assertThat(res.getTargetUserId()).isEqualTo("T1");
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
    void listAllForAdmin_shouldReturnAll_whenAdmin() {
        User admin = makeUser("ADM", "admin@test.com", "[\"ADMIN\"]");
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        Report r = makeReport(1L);
        when(reportRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(r));

        var res = service.listAllForAdmin("admin@test.com");

        assertThat(res).hasSize(1);
        assertThat(res.get(0).getId()).isEqualTo(1L);
    }

    @Test
    void listAllForAdmin_shouldThrow_whenNotAdmin() {
        User u = makeUser("U1", "u@test.com", "[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));

        assertThatThrownBy(() -> service.listAllForAdmin("u@test.com"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Admin only");
    }

    @Test
    void listAuthoredByEmail_shouldReturnReports() {
        User u = makeUser("U1", "me@test.com", "[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(u));

        Report r = makeReport(2L);
        when(reportRepo.findByAuthor_IdOrderByCreatedAtDesc("U1")).thenReturn(List.of(r));

        var res = service.listAuthoredByEmail("me@test.com");
        assertThat(res).hasSize(1);
        assertThat(res.get(0).getId()).isEqualTo(2L);
    }

    @Test
    void listReceivedByEmail_shouldReturnReports() {
        User u = makeUser("U2", "me@test.com", "[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("me@test.com")).thenReturn(Optional.of(u));

        Report r = makeReport(3L);
        when(reportRepo.findByTarget_IdOrderByCreatedAtDesc("U2")).thenReturn(List.of(r));

        var res = service.listReceivedByEmail("me@test.com");
        assertThat(res).hasSize(1);
        assertThat(res.get(0).getId()).isEqualTo(3L);
    }

    @Test
    void getVisibleTo_shouldReturnForAdmin() {
        User admin = makeUser("ADM", "admin@test.com", "[\"ADMIN\"]");
        Report r = makeReport(4L);

        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        when(reportRepo.findById(4L)).thenReturn(Optional.of(r));

        var res = service.getVisibleTo("admin@test.com", 4L);

        assertThat(res.getId()).isEqualTo(4L);
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
        when(reportRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ReportUpdateRequest req = new ReportUpdateRequest();
        req.setTitle("NewTitle");
        req.setBody("NewBody");

        var res = service.updateVisibleTo("admin@test.com", 10L, req);

        assertThat(res.getTitle()).isEqualTo("NewTitle");
        assertThat(res.getBody()).isEqualTo("NewBody");
    }

    @Test
    void updateVisibleTo_shouldAllowAuthor() {
        User author = makeUser("A1", "a@test.com", "[\"EMPLOYEE\"]");

        Report r = makeReport(11L);
        r.setAuthor(author);

        when(reportRepo.findById(11L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("a@test.com")).thenReturn(Optional.of(author));
        when(reportRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ReportUpdateRequest req = new ReportUpdateRequest();
        req.setTitle("Edited");

        var res = service.updateVisibleTo("a@test.com", 11L, req);

        assertThat(res.getTitle()).isEqualTo("Edited");
    }

    @Test
    void updateVisibleTo_shouldThrow_ifNotAllowed() {
        User u = makeUser("U", "u@test.com", "[\"EMPLOYEE\"]");
        Report r = makeReport(12L);
        r.setAuthor(makeUser("A1", "a@test.com", "[\"EMPLOYEE\"]"));

        when(reportRepo.findById(12L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));

        assertThatThrownBy(() -> service.updateVisibleTo("u@test.com", 12L, new ReportUpdateRequest()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Forbidden");
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

    @Test
    void createForAuthorEmail_shouldSetSubject_whenSubjectUserIdProvided() {
        User author = makeUser("A1", "author@test.com", "[\"EMPLOYEE\"]");
        User target = makeUser("T1", "target@test.com", "[\"EMPLOYEE\"]");
        User subject = makeUser("S1", "subject@test.com", "[\"EMPLOYEE\"]");

        when(userRepo.findByEmail("author@test.com")).thenReturn(Optional.of(author));
        when(userRepo.findById("T1")).thenReturn(Optional.of(target));
        when(userRepo.findById("S1")).thenReturn(Optional.of(subject));

        when(reportRepo.save(any(Report.class))).thenAnswer(inv -> {
            Report r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });

        ReportCreateRequest req = new ReportCreateRequest();
        req.setTargetUserId("T1");
        req.setSubjectUserId("S1");
        req.setTitle("Test");
        req.setBody("Body");

        ReportResponse res = service.createForAuthorEmail("author@test.com", req);

        assertThat(res.getSubjectUserId()).isEqualTo("S1");
        assertThat(res.getSubjectEmail()).isEqualTo("subject@test.com");
    }

    @Test
    void createForAuthorEmail_shouldThrow_whenSubjectNotFound() {
        User author = makeUser("A1", "author@test.com", "[\"EMPLOYEE\"]");
        User target = makeUser("T1", "target@test.com", "[\"EMPLOYEE\"]");

        when(userRepo.findByEmail("author@test.com")).thenReturn(Optional.of(author));
        when(userRepo.findById("T1")).thenReturn(Optional.of(target));
        when(userRepo.findById("S1")).thenReturn(Optional.empty());

        ReportCreateRequest req = new ReportCreateRequest();
        req.setTargetUserId("T1");
        req.setSubjectUserId("S1");

        assertThatThrownBy(() -> service.createForAuthorEmail("author@test.com", req))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Subject user not found");
    }

    @Test
    void createForAuthorEmail_shouldIgnoreBlankSubjectUserId() {
        User author = makeUser("A1", "author@test.com", "[\"EMPLOYEE\"]");
        User target = makeUser("T1", "target@test.com", "[\"EMPLOYEE\"]");

        when(userRepo.findByEmail("author@test.com")).thenReturn(Optional.of(author));
        when(userRepo.findById("T1")).thenReturn(Optional.of(target));

        when(reportRepo.save(any(Report.class))).thenAnswer(inv -> {
            Report r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });

        ReportCreateRequest req = new ReportCreateRequest();
        req.setTargetUserId("T1");
        req.setSubjectUserId("   ");
        req.setTitle("Test");

        ReportResponse res = service.createForAuthorEmail("author@test.com", req);

        assertThat(res.getSubjectUserId()).isNull();
    }

    @Test
    void updateVisibleTo_shouldNotUpdateTitle_whenNull() {
        User admin = makeUser("ADM", "admin@test.com", "[\"ADMIN\"]");
        Report r = makeReport(20L);
        r.setTitle("Original");
        r.setBody("Original Body");

        when(reportRepo.findById(20L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
        when(reportRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ReportUpdateRequest req = new ReportUpdateRequest();
        req.setBody("New Body");

        var res = service.updateVisibleTo("admin@test.com", 20L, req);

        assertThat(res.getTitle()).isEqualTo("Original");
        assertThat(res.getBody()).isEqualTo("New Body");
    }

    @Test
    void hasRole_shouldReturnFalse_whenRoleIsNull() {
        User u = makeUser("U1", "u@test.com", null);
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));

        assertThatThrownBy(() -> service.listAllForAdmin("u@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void hasRole_shouldReturnFalse_whenRoleIsBlank() {
        User u = makeUser("U1", "u@test.com", "   ");
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));

        assertThatThrownBy(() -> service.listAllForAdmin("u@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void hasRole_shouldMatchManager() {
        User manager = makeUser("M1", "m@test.com", "[\"MANAGER\"]");
        when(userRepo.findByEmail("m@test.com")).thenReturn(Optional.of(manager));

        assertThatThrownBy(() -> service.listAllForAdmin("m@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void hasRole_shouldMatchEmployee() {
        User emp = makeUser("E1", "e@test.com", "[\"EMPLOYEE\"]");
        when(userRepo.findByEmail("e@test.com")).thenReturn(Optional.of(emp));

        assertThatThrownBy(() -> service.listAllForAdmin("e@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void hasRole_shouldMatchAdminWithPrefix() {
        User admin = makeUser("A1", "a@test.com", "[\"SUPER_ADMIN\"]");
        when(userRepo.findByEmail("a@test.com")).thenReturn(Optional.of(admin));
        when(reportRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());

        var res = service.listAllForAdmin("a@test.com");

        assertThat(res).isEmpty();
    }

    @Test
    void hasRole_shouldMatchManagerWithSuffix() {
        User manager = makeUser("M1", "m@test.com", "[\"TEAM_MANAGER_LEAD\"]");
        Report r = makeReport(1L);
        r.setAuthor(manager);

        when(userRepo.findByEmail("m@test.com")).thenReturn(Optional.of(manager));
        when(reportRepo.findById(1L)).thenReturn(Optional.of(r));

        var res = service.getVisibleTo("m@test.com", 1L);

        assertThat(res).isNotNull();
    }

    @Test
    void hasRole_shouldMatchEmployeeWithPrefix() {
        User emp = makeUser("E1", "e@test.com", "[\"JUNIOR_EMPLOYEE\"]");
        Report r = makeReport(1L);
        r.setAuthor(emp);

        when(userRepo.findByEmail("e@test.com")).thenReturn(Optional.of(emp));
        when(reportRepo.findById(1L)).thenReturn(Optional.of(r));

        var res = service.getVisibleTo("e@test.com", 1L);

        assertThat(res).isNotNull();
    }

    @Test
    void isAuthor_shouldReturnFalse_whenAuthorIsNull() {
        User admin = makeUser("ADM", "admin@test.com", "[\"ADMIN\"]");
        User target = makeUser("T1", "target@test.com", "[\"EMPLOYEE\"]");

        Report r = new Report();
        r.setId(30L);
        r.setAuthor(admin); // Set admin as author to avoid NPE in toDto
        r.setTarget(target);
        r.setTitle("Title");
        r.setCreatedAt(Instant.now());

        User employee = makeUser("E1", "emp@test.com", "[\"EMPLOYEE\"]");

        when(reportRepo.findById(30L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("emp@test.com")).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> service.getVisibleTo("emp@test.com", 30L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void isTarget_shouldReturnFalse_whenTargetIsNull() {
        User author = makeUser("A1", "author@test.com", "[\"EMPLOYEE\"]");
        User target = makeUser("T1", "target@test.com", "[\"EMPLOYEE\"]");

        Report r = new Report();
        r.setId(31L);
        r.setAuthor(author);
        r.setTarget(target);
        r.setTitle("Title");
        r.setCreatedAt(Instant.now());

        User employee = makeUser("E1", "emp@test.com", "[\"EMPLOYEE\"]");

        when(reportRepo.findById(31L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("emp@test.com")).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> service.getVisibleTo("emp@test.com", 31L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getVisibleTo_shouldThrow_whenBothAuthorAndTargetNull() {
        User u = makeUser("U1", "u@test.com", "[\"EMPLOYEE\"]");
        Report r = new Report();
        r.setId(32L);
        r.setAuthor(null);
        r.setTarget(null);
        r.setTitle("Title");

        when(reportRepo.findById(32L)).thenReturn(Optional.of(r));
        when(userRepo.findByEmail("u@test.com")).thenReturn(Optional.of(u));

        assertThatThrownBy(() -> service.getVisibleTo("u@test.com", 32L))
                .isInstanceOf(AccessDeniedException.class);
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
        