// src/main/java/com/example/time_manager/service/leave/LeaveTypeService.java
package com.example.time_manager.service.leave;

import com.example.time_manager.model.leave.LeaveType;
import com.example.time_manager.repository.leave.LeaveTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class LeaveTypeService {
  private final LeaveTypeRepository repo;
  public LeaveTypeService(LeaveTypeRepository repo) { this.repo = repo; }

  public List<LeaveType> listAll() { return repo.findAll(); }

  public LeaveType getByCode(String code) {
    return repo.findById(code).orElseThrow(() -> new IllegalArgumentException("LeaveType not found: " + code));
  }

  public LeaveType create(String code, String label) {
    if (repo.existsById(code)) throw new IllegalStateException("LeaveType already exists: " + code);
    return repo.save(new LeaveType(code, label));
  }

  public LeaveType update(String code, String label) {
    LeaveType lt = getByCode(code);
    if (label != null) lt.setLabel(label);
    return repo.save(lt);
  }

  public boolean delete(String code) {
    if (!repo.existsById(code)) return false;
    repo.deleteById(code);
    return true;
  }
}
