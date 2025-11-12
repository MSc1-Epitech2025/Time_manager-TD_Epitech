package com.example.time_manager.repository.leave;

import com.example.time_manager.model.leave.LeaveAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaveAccountRepository extends JpaRepository<LeaveAccount, Long> {
  List<LeaveAccount> findByUser_Id(String userId);
  Optional<LeaveAccount> findByUser_IdAndLeaveType_Code(String userId, String code);
  boolean existsByUser_IdAndLeaveType_Code(String userId, String code);
}
