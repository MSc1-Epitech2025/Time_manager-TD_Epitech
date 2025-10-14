package com.example.time_manager.repository;

import com.example.time_manager.model.leave.LeaveAccount;
import com.example.time_manager.model.leave.LeaveType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveAccountRepository extends JpaRepository<LeaveAccount, Integer> {
  Optional<LeaveAccount> findByUserIdAndLeaveType(String userId, LeaveType leaveType);
}
