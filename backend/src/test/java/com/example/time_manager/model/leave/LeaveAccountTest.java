package com.example.time_manager.model.leave;

import com.example.time_manager.model.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class LeaveAccountTest {

    @Test
    void testAllGettersAndSetters() {
        LeaveAccount account = new LeaveAccount();

        Long id = 100L;
        User user = new User();
        LeaveType leaveType = new LeaveType();
        BigDecimal openingBalance = new BigDecimal("10.50");
        BigDecimal accrualPerMonth = new BigDecimal("1.250");
        BigDecimal maxCarryover = new BigDecimal("5.00");
        LocalDate expireOn = LocalDate.of(2025, 12, 31);
        Instant createdAt = Instant.now();

        account.setId(id);
        account.setUser(user);
        account.setLeaveType(leaveType);
        account.setOpeningBalance(openingBalance);
        account.setAccrualPerMonth(accrualPerMonth);
        account.setMaxCarryover(maxCarryover);
        account.setCarryoverExpireOn(expireOn);
        account.setCreatedAt(createdAt);

        assertEquals(id, account.getId());
        assertEquals(user, account.getUser());
        assertEquals(leaveType, account.getLeaveType());
        assertEquals(openingBalance, account.getOpeningBalance());
        assertEquals(accrualPerMonth, account.getAccrualPerMonth());
        assertEquals(maxCarryover, account.getMaxCarryover());
        assertEquals(expireOn, account.getCarryoverExpireOn());
        assertEquals(createdAt, account.getCreatedAt());
    }

    @Test
    void testDefaultConstructorValues() {
        LeaveAccount account = new LeaveAccount();

        // Les valeurs par défaut doivent être BigDecimal.ZERO
        assertEquals(BigDecimal.ZERO, account.getOpeningBalance());
        assertEquals(BigDecimal.ZERO, account.getAccrualPerMonth());

        // Les autres doivent être null
        assertNull(account.getId());
        assertNull(account.getUser());
        assertNull(account.getLeaveType());
        assertNull(account.getMaxCarryover());
        assertNull(account.getCarryoverExpireOn());
        assertNull(account.getCreatedAt());
    }

    @Test
    void testModifyFieldsSequentially() {
        LeaveAccount account = new LeaveAccount();

        account.setOpeningBalance(new BigDecimal("0.00"));
        assertEquals(new BigDecimal("0.00"), account.getOpeningBalance());

        account.setOpeningBalance(new BigDecimal("50.75"));
        assertEquals(new BigDecimal("50.75"), account.getOpeningBalance());

        account.setAccrualPerMonth(new BigDecimal("2.333"));
        assertEquals(new BigDecimal("2.333"), account.getAccrualPerMonth());

        account.setMaxCarryover(new BigDecimal("9.99"));
        assertEquals(new BigDecimal("9.99"), account.getMaxCarryover());
    }

    @Test
    void testCarryoverDateAndCreatedAt() {
        LeaveAccount account = new LeaveAccount();
        LocalDate date1 = LocalDate.of(2025, 5, 1);
        LocalDate date2 = LocalDate.of(2025, 6, 1);
        Instant instant1 = Instant.now();
        Instant instant2 = instant1.plusSeconds(60);

        account.setCarryoverExpireOn(date1);
        assertEquals(date1, account.getCarryoverExpireOn());

        account.setCarryoverExpireOn(date2);
        assertEquals(date2, account.getCarryoverExpireOn());

        account.setCreatedAt(instant1);
        assertEquals(instant1, account.getCreatedAt());

        account.setCreatedAt(instant2);
        assertEquals(instant2, account.getCreatedAt());
    }

    @Test
    void testUserAndLeaveTypeChanges() {
        LeaveAccount account = new LeaveAccount();
        User user1 = new User();
        User user2 = new User();
        LeaveType type1 = new LeaveType();
        LeaveType type2 = new LeaveType();

        account.setUser(user1);
        assertEquals(user1, account.getUser());

        account.setUser(user2);
        assertEquals(user2, account.getUser());

        account.setLeaveType(type1);
        assertEquals(type1, account.getLeaveType());

        account.setLeaveType(type2);
        assertEquals(type2, account.getLeaveType());
    }

    @Test
    void testIdChanges() {
        LeaveAccount account = new LeaveAccount();

        account.setId(1L);
        assertEquals(1L, account.getId());

        account.setId(2L);
        assertEquals(2L, account.getId());
    }
}
