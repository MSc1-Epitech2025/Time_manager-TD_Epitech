package com.example.time_manager.service;

import com.example.time_manager.dto.KpiFullDataResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KpiService {

    private final UserRepository userRepository;
    private final ClockRepository clockRepository;
    private final AbsenceRepository absenceRepository;
    private final WorkScheduleRepository scheduleRepository;

    public KpiFullDataResponse getFullData() {

        KpiFullDataResponse resp = new KpiFullDataResponse();

        resp.setUsers(
                userRepository.findAll().stream().map(u -> {
                    KpiFullDataResponse.KpiUserDto dto = new KpiFullDataResponse.KpiUserDto();
                    dto.setId(u.getId());
                    dto.setFirstName(u.getFirstName());
                    dto.setLastName(u.getLastName());
                    dto.setEmail(u.getEmail());
                    dto.setPoste(u.getPoste());
                    dto.setTeam(u.getTeam() != null ? u.getTeam().getName() : null);
                    return dto;
                }).toList()
        );

        resp.setClocks(
                clockRepository.findAll().stream().map(c -> {
                    KpiFullDataResponse.KpiClockDto dto = new KpiFullDataResponse.KpiClockDto();
                    dto.setId(c.getId());
                    dto.setUserId(c.getUser().getId());
                    dto.setKind(c.getKind().name());
                    dto.setAt(c.getAt().toString());
                    return dto;
                }).toList()
        );

        resp.setAbsences(
                absenceRepository.findAllApproved().stream().map(a -> {
                    KpiFullDataResponse.KpiAbsenceDto dto = new KpiFullDataResponse.KpiAbsenceDto();
                    dto.setId(a.getId());
                    dto.setUserId(a.getUser().getId());
                    dto.setStartDate(a.getStartDate().toString());
                    dto.setEndDate(a.getEndDate().toString());
                    dto.setStatus(a.getStatus().name());
                    dto.setType(a.getType());
                    dto.setDays(
                            a.getDays().stream().map(d -> {
                                KpiFullDataResponse.KpiAbsenceDayDto dd = new KpiFullDataResponse.KpiAbsenceDayDto();
                                dd.setAbsenceDate(d.getAbsenceDate().toString());
                                dd.setPeriod(d.getPeriod().name());
                                return dd;
                            }).toList()
                    );
                    return dto;
                }).toList()
        );

        resp.setSchedules(
                scheduleRepository.findAll().stream().map(s -> {
                    KpiFullDataResponse.KpiScheduleDto dto = new KpiFullDataResponse.KpiScheduleDto();
                    dto.setUserId(s.getUser().getId());
                    dto.setDate(s.getDate().toString());
                    return dto;
                }).toList()
        );

        return resp;
    }
}
