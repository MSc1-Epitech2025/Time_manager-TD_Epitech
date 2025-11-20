package com.example.time_manager.service;

import com.example.time_manager.dto.kpi.KpiFullDataResponse;
import com.example.time_manager.dto.kpi.KpiFullDataResponse.*;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.repository.ClockRepository;
import com.example.time_manager.repository.AbsenceRepository;
import com.example.time_manager.repository.WorkScheduleRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class KpiService {

    private final UserRepository userRepository;
    private final ClockRepository clockRepository;
    private final AbsenceRepository absenceRepository;
    private final WorkScheduleRepository scheduleRepository;

    public KpiService(
            UserRepository userRepository,
            ClockRepository clockRepository,
            AbsenceRepository absenceRepository,
            WorkScheduleRepository scheduleRepository
    ) {
        this.userRepository = userRepository;
        this.clockRepository = clockRepository;
        this.absenceRepository = absenceRepository;
        this.scheduleRepository = scheduleRepository;
    }

    public KpiFullDataResponse getFullData() {
    KpiFullDataResponse resp = new KpiFullDataResponse();

    // Utiliser Collections.emptyList() pour garantir non-null
    resp.setUsers(Optional.ofNullable(userRepository.findAll())
                          .orElse(Collections.emptyList())
                          .stream().map(u -> {
                              KpiUserDto dto = new KpiUserDto();
                              dto.setId(u.getId());
                              dto.setFirstName(u.getFirstName());
                              dto.setLastName(u.getLastName());
                              dto.setEmail(u.getEmail());
                              dto.setPoste(u.getPoste());
                              dto.setTeam(u.getTeam());
                              return dto;
                          }).collect(Collectors.toList()));

    resp.setClocks(Optional.ofNullable(clockRepository.findAll())
                           .orElse(Collections.emptyList())
                           .stream().map(c -> {
                               KpiClockDto dto = new KpiClockDto();
                               dto.setId(c.getId());
                               dto.setUserId(c.getUserId());
                               dto.setKind(c.getKind());
                               dto.setAt(c.getAt().toString());
                               return dto;
                           }).collect(Collectors.toList()));

    resp.setAbsences(Optional.ofNullable(absenceRepository.findAll())
                             .orElse(Collections.emptyList())
                             .stream().map(a -> {
                                 KpiAbsenceDto dto = new KpiAbsenceDto();
                                 dto.setId(a.getId());
                                 dto.setUserId(a.getUserId());
                                 dto.setStartDate(a.getStartDate() != null ? a.getStartDate().toString() : null);
                                 dto.setEndDate(a.getEndDate() != null ? a.getEndDate().toString() : null);
                                 dto.setStatus(a.getStatus());
                                 dto.setType(a.getType());
                                 dto.setDays(Optional.ofNullable(a.getDays())
                                                     .orElse(Collections.emptyList())
                                                     .stream().map(d -> {
                                                         KpiAbsenceDayDto dayDto = new KpiAbsenceDayDto();
                                                         dayDto.setAbsenceDate(d.getAbsenceDate().toString());
                                                         dayDto.setPeriod(d.getPeriod());
                                                         return dayDto;
                                                     }).collect(Collectors.toList()));
                                 return dto;
                             }).collect(Collectors.toList()));

    resp.setSchedules(Optional.ofNullable(scheduleRepository.findAll())
                              .orElse(Collections.emptyList())
                              .stream().map(s -> {
                                  KpiScheduleDto dto = new KpiScheduleDto();
                                  dto.setUserId(s.getUserId());
                                  dto.setDate(s.getDate().toString());
                                  return dto;
                              }).collect(Collectors.toList()));

    return resp;
}

}
