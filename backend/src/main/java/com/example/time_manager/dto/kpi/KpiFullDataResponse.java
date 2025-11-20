package com.example.time_manager.dto.kpi;

import lombok.Data;
import java.util.List;

@Data
public class KpiFullDataResponse {

    private List<KpiUserDto> users;
    private List<KpiClockDto> clocks;
    private List<KpiAbsenceDto> absences;
    private List<KpiScheduleDto> schedules;

    @Data
    public static class KpiUserDto {
        private String id;
        private String firstName;
        private String lastName;
        private String email;
        private String poste;
        private String team;
    }

    @Data
    public static class KpiClockDto {
        private String id;
        private String userId;
        private String kind;
        private String at;
    }

    @Data
    public static class KpiAbsenceDayDto {
        private String absenceDate;
        private String period;
    }

    @Data
    public static class KpiAbsenceDto {
        private String id;
        private String userId;
        private String startDate;
        private String endDate;
        private String status;
        private String type;
        private List<KpiAbsenceDayDto> days;
    }

    @Data
    public static class KpiScheduleDto {
        private String userId;
        private String date;
    }
}
