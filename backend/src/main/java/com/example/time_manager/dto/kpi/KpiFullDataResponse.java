package com.example.time_manager.dto.kpi;

import java.util.List;

public class KpiFullDataResponse {

    private List<KpiUserDto> users;
    private List<KpiClockDto> clocks;
    private List<KpiAbsenceDto> absences;
    private List<KpiScheduleDto> schedules;

    // Getters / Setters
    public List<KpiUserDto> getUsers() { return users; }
    public void setUsers(List<KpiUserDto> users) { this.users = users; }

    public List<KpiClockDto> getClocks() { return clocks; }
    public void setClocks(List<KpiClockDto> clocks) { this.clocks = clocks; }

    public List<KpiAbsenceDto> getAbsences() { return absences; }
    public void setAbsences(List<KpiAbsenceDto> absences) { this.absences = absences; }

    public List<KpiScheduleDto> getSchedules() { return schedules; }
    public void setSchedules(List<KpiScheduleDto> schedules) { this.schedules = schedules; }


    // ======= INNER DTOS =======

    public static class KpiUserDto {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String poste;
        private String team;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPoste() { return poste; }
        public void setPoste(String poste) { this.poste = poste; }

        public String getTeam() { return team; }
        public void setTeam(String team) { this.team = team; }
    }


    public static class KpiClockDto {
        private Long id;
        private Long userId;
        private String kind;
        private String at;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getKind() { return kind; }
        public void setKind(String kind) { this.kind = kind; }

        public String getAt() { return at; }
        public void setAt(String at) { this.at = at; }
    }


    public static class KpiAbsenceDto {
        private Long id;
        private Long userId;
        private String startDate;
        private String endDate;
        private String status;
        private String type;
        private List<KpiAbsenceDayDto> days;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }

        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public List<KpiAbsenceDayDto> getDays() { return days; }
        public void setDays(List<KpiAbsenceDayDto> days) { this.days = days; }
    }


    public static class KpiAbsenceDayDto {
        private String absenceDate;
        private String period;

        public String getAbsenceDate() { return absenceDate; }
        public void setAbsenceDate(String absenceDate) { this.absenceDate = absenceDate; }

        public String getPeriod() { return period; }
        public void setPeriod(String period) { this.period = period; }
    }


    public static class KpiScheduleDto {
        private Long userId;
        private String date;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
    }
}
