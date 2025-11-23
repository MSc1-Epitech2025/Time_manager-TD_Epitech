package com.example.time_manager.service;

import com.example.time_manager.model.Team;
import com.example.time_manager.dto.kpi.KpiFullDataResponse;
import com.example.time_manager.dto.kpi.KpiFullDataResponse.*;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.repository.TeamRepository;
import com.example.time_manager.repository.TeamMemberRepository;
import com.example.time_manager.repository.ClockRepository;
import com.example.time_manager.repository.AbsenceRepository;
import com.example.time_manager.repository.WorkScheduleRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.stream.Collectors; 
import java.util.Optional;
import java.util.List;


@Service
public class KpiService {

    private final UserRepository userRepository;
    private final ClockRepository clockRepository;
    private final AbsenceRepository absenceRepository;
    private final WorkScheduleRepository scheduleRepository;
    private final TeamRepository teamRepository;
private final TeamMemberRepository teamMemberRepository;


    public KpiService(
            UserRepository userRepository,
            ClockRepository clockRepository,
            AbsenceRepository absenceRepository,
            WorkScheduleRepository scheduleRepository,
            TeamRepository teamRepository,
        TeamMemberRepository teamMemberRepository

    ) {
        this.userRepository = userRepository;
        this.clockRepository = clockRepository;
        this.absenceRepository = absenceRepository;
        this.scheduleRepository = scheduleRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    public KpiFullDataResponse getFullData() {
        KpiFullDataResponse resp = new KpiFullDataResponse();

        // Users
        resp.setUsers(Optional.ofNullable(userRepository.findAll())
        .orElse(Collections.emptyList())
        .stream().map(u -> {
            KpiUserDto dto = new KpiUserDto();
            dto.setId(String.valueOf(u.getId())); 
            dto.setFirstName(u.getFirstName());
            dto.setLastName(u.getLastName());
            dto.setEmail(u.getEmail());
            dto.setPoste(u.getPoste());

         List<Long> teamIds = teamMemberRepository.findTeamIdsByUserId(u.getId());
        if (!teamIds.isEmpty()) {
    Long teamId = teamIds.get(0);
    String teamName = teamRepository.findById(teamId)
                        .map(Team::getName)
                        .orElse("Not affected");
    dto.setTeam(teamName); // Assurez-vous que setTeam existe
} else {
    dto.setTeam("Not affected");
}

            return dto;
        }).collect(Collectors.toList()));

        /* 
        // Teams
        resp.setTeams(teamMemberRepository.findAll()
        .stream()
        .map(tm -> {
            KpiFullDataResponse.KpiTeamsDto dto = new KpiFullDataResponse.KpiTeamsDto();
            //dto.setId(tm.getTeam().getId());
            dto.setName(tm.getTeam().getName());

            List<String> userIds = teamMemberRepository.findUserIdsByTeamId(tm.getTeam().getId());
            dto.setUserIds(userIds);

            return dto;
        })
        .collect(Collectors.toList()));

        */
// Clocks
resp.setClocks(Optional.ofNullable(clockRepository.findAll())
        .orElse(Collections.emptyList())
        .stream().map(c -> {
            KpiClockDto dto = new KpiClockDto();
            dto.setId(String.valueOf(c.getId()));  
            dto.setUserId(c.getUser().getId());    
            dto.setKind(c.getKind().name());       
            dto.setAt(c.getAt().toString());
            return dto;
        }).collect(Collectors.toList()));

resp.setAbsences(Optional.ofNullable(absenceRepository.findAll())
        .orElse(Collections.emptyList())
        .stream().map(a -> {
            KpiAbsenceDto dto = new KpiAbsenceDto();
            dto.setId(String.valueOf(a.getId()));            
            dto.setUserId(String.valueOf(a.getUserId()));    
            dto.setStartDate(a.getStartDate().toString());   
            dto.setEndDate(a.getEndDate().toString());       
            dto.setStatus(a.getStatus().name());             
            dto.setType(a.getType().name());                 
            dto.setDays(Optional.ofNullable(a.getDays())
                    .orElse(Collections.emptyList())
                    .stream().map(d -> {
                        KpiAbsenceDayDto dayDto = new KpiAbsenceDayDto();
                        dayDto.setAbsenceDate(d.getAbsenceDate().toString()); 
                        dayDto.setPeriod(d.getPeriod().name());               
                        return dayDto;
                    }).collect(Collectors.toList()));
            return dto;
        }).collect(Collectors.toList()));

resp.setSchedules(Optional.ofNullable(scheduleRepository.findAll())
        .orElse(Collections.emptyList())
        .stream().map(s -> {
            KpiScheduleDto dto = new KpiScheduleDto();
            dto.setUserId(s.getUserId());              
            dto.setDayOfWeek(s.getDayOfWeek().name());
dto.setPeriod(s.getPeriod().name());
dto.setStartTime(s.getStartTime().toString());
dto.setEndTime(s.getEndTime().toString());
            return dto;
        }).collect(Collectors.toList()));



        return resp;
    }

}
