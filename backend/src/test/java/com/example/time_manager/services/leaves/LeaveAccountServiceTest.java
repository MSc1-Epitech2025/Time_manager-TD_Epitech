package com.example.time_manager.services.leaves;

import com.example.time_manager.model.User;
import com.example.time_manager.model.leave.LeaveAccount;
import com.example.time_manager.model.leave.LeaveType;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.repository.leave.LeaveAccountRepository;
import com.example.time_manager.repository.leave.LeaveLedgerRepository;
import com.example.time_manager.service.leave.LeaveAccountService;
import com.example.time_manager.service.leave.LeaveTypeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LeaveAccountServiceTest {

    private LeaveAccountRepository repo;
    private UserRepository userRepo;
    private LeaveTypeService leaveTypeService;
    private LeaveLedgerRepository ledgerRepo;
    private LeaveAccountService service;

    private final String userId = "u1";
    private final String leaveCode = "VAC";
    private final Long accountId = 10L;

    @BeforeEach
    void setUp() {
        repo = mock(LeaveAccountRepository.class);
        userRepo = mock(UserRepository.class);
        leaveTypeService = mock(LeaveTypeService.class);
        ledgerRepo = mock(LeaveLedgerRepository.class);
        service = new LeaveAccountService(repo, userRepo, leaveTypeService, ledgerRepo);
    }

    @Test
    void testCreate_Success() {
        when(repo.existsByUser_IdAndLeaveType_Code(userId, leaveCode)).thenReturn(false);
        User user = new User();
        user.setId(userId);
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));

        LeaveType type = new LeaveType();
        type.setCode(leaveCode);
        when(leaveTypeService.getByCode(leaveCode)).thenReturn(type);

        LeaveAccount saved = new LeaveAccount();
        when(repo.save(any())).thenReturn(saved);

        LeaveAccount acc = service.create(userId, leaveCode,
                new BigDecimal("10"), new BigDecimal("2"),
                new BigDecimal("5"), LocalDate.now());

        assertNotNull(acc);
        verify(repo).save(any());
    }

    @Test
    void testCreate_AlreadyExists_Throws() {
        when(repo.existsByUser_IdAndLeaveType_Code(userId, leaveCode)).thenReturn(true);
        assertThrows(IllegalStateException.class, () ->
                service.create(userId, leaveCode, BigDecimal.ONE, BigDecimal.ONE, null, LocalDate.now()));
        verify(repo, never()).save(any());
    }

    @Test
    void testCreate_UserNotFound_Throws() {
        when(repo.existsByUser_IdAndLeaveType_Code(userId, leaveCode)).thenReturn(false);
        when(userRepo.findById(userId)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () ->
                service.create(userId, leaveCode, null, null, null, LocalDate.now()));
    }

    @Test
    void testCreate_NullBalances_DefaultsToZero() {
        when(repo.existsByUser_IdAndLeaveType_Code(userId, leaveCode)).thenReturn(false);
        User user = new User();
        when(userRepo.findById(userId)).thenReturn(Optional.of(user));
        LeaveType type = new LeaveType();
        when(leaveTypeService.getByCode(leaveCode)).thenReturn(type);

        when(repo.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LeaveAccount acc = service.create(userId, leaveCode, null, null,
                new BigDecimal("15"), LocalDate.of(2025, 1, 1));

        assertEquals(BigDecimal.ZERO, acc.getOpeningBalance());
        assertEquals(BigDecimal.ZERO, acc.getAccrualPerMonth());
        assertEquals(new BigDecimal("15"), acc.getMaxCarryover());
    }

    @Test
    void testUpdate_Success_AllFields() {
        LeaveAccount existing = new LeaveAccount();
        existing.setId(accountId);
        when(repo.findById(accountId)).thenReturn(Optional.of(existing));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        LeaveAccount updated = service.update(accountId,
                new BigDecimal("5"), new BigDecimal("2"),
                new BigDecimal("8"), LocalDate.of(2025, 1, 1));

        assertEquals(new BigDecimal("5"), updated.getOpeningBalance());
        assertEquals(new BigDecimal("2"), updated.getAccrualPerMonth());
        assertEquals(new BigDecimal("8"), updated.getMaxCarryover());
        assertEquals(LocalDate.of(2025, 1, 1), updated.getCarryoverExpireOn());
    }

    @Test
    void testUpdate_NotFound_Throws() {
        when(repo.findById(accountId)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () ->
                service.update(accountId, BigDecimal.ONE, null, null, null));
    }

    @Test
    void testUpdate_PartialValues_NullIgnored() {
        LeaveAccount existing = new LeaveAccount();
        existing.setOpeningBalance(BigDecimal.TEN);
        existing.setAccrualPerMonth(BigDecimal.ONE);
        existing.setMaxCarryover(new BigDecimal("5"));
        existing.setCarryoverExpireOn(LocalDate.of(2025, 1, 1));

        when(repo.findById(accountId)).thenReturn(Optional.of(existing));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        LeaveAccount updated = service.update(accountId, null, null, null, LocalDate.of(2030, 5, 5));

        assertEquals(BigDecimal.TEN, updated.getOpeningBalance());
        assertEquals(BigDecimal.ONE, updated.getAccrualPerMonth());
        assertEquals(new BigDecimal("5"), updated.getMaxCarryover());
        assertEquals(LocalDate.of(2030, 5, 5), updated.getCarryoverExpireOn());
    }

    @Test
    void testDelete_Existing() {
        when(repo.existsById(accountId)).thenReturn(true);
        boolean result = service.delete(accountId);
        assertTrue(result);
        verify(repo).deleteById(accountId);
    }

    @Test
    void testDelete_NotExisting() {
        when(repo.existsById(accountId)).thenReturn(false);
        boolean result = service.delete(accountId);
        assertFalse(result);
        verify(repo, never()).deleteById(any());
    }

    @Test
    void testGet_Success() {
        LeaveAccount acc = new LeaveAccount();
        when(repo.findById(accountId)).thenReturn(Optional.of(acc));
        LeaveAccount result = service.get(accountId);
        assertEquals(acc, result);
    }

    @Test
    void testGet_NotFound_Throws() {
        when(repo.findById(accountId)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.get(accountId));
    }

    @Test
    void testListByUser() {
        List<LeaveAccount> accounts = List.of(new LeaveAccount());
        when(repo.findByUser_Id(userId)).thenReturn(accounts);
        List<LeaveAccount> result = service.listByUser(userId);
        assertEquals(1, result.size());
    }

    @Test
    void testComputeCurrentBalance_WithOpeningAndDelta() {
        LeaveAccount acc = new LeaveAccount();
        acc.setOpeningBalance(new BigDecimal("10"));
        when(repo.findById(accountId)).thenReturn(Optional.of(acc));
        when(ledgerRepo.sumSignedAmountByAccountId(accountId)).thenReturn(Optional.of(new BigDecimal("5")));

        BigDecimal result = service.computeCurrentBalance(accountId);
        assertEquals(new BigDecimal("15"), result);
    }

    @Test
    void testComputeCurrentBalance_NullOpeningAndNullDelta() {
        LeaveAccount acc = new LeaveAccount();
        acc.setOpeningBalance(null);
        when(repo.findById(accountId)).thenReturn(Optional.of(acc));
        when(ledgerRepo.sumSignedAmountByAccountId(accountId)).thenReturn(Optional.empty());

        BigDecimal result = service.computeCurrentBalance(accountId);
        assertEquals(BigDecimal.ZERO, result);
    }
    @Test
    void testListByUserEmail_Success() {
        String email = "test@example.com";
        User user = new User();
        user.setId(userId);
        user.setEmail(email);

        List<LeaveAccount> accounts = List.of(new LeaveAccount());

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(repo.findByUser_Id(userId)).thenReturn(accounts);

        List<LeaveAccount> result = service.listByUserEmail(email);

        assertEquals(1, result.size());
        verify(userRepo).findByEmail(email);
        verify(repo).findByUser_Id(userId);
    }

    @Test
    void testListByUserEmail_UserNotFound_Throws() {
        String email = "unknown@example.com";

        when(userRepo.findByEmail(email)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.listByUserEmail(email));

        assertTrue(ex.getMessage().contains("User not found with email"));
        verify(repo, never()).findByUser_Id(any());
    }
}
