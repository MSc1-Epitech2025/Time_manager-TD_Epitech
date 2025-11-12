package com.example.time_manager.repository.leave;

import com.example.time_manager.model.leave.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveTypeRepository extends JpaRepository<LeaveType, String> { }
