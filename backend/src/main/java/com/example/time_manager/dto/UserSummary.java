package com.example.time_manager.dto;

public class UserSummary {
    public String id;
    public String firstName;
    public String lastName;
    public String email;

    public UserSummary(String id, String firstName, String lastName, String email) {
        this.id=id; this.firstName=firstName; this.lastName=lastName; this.email=email;
    }
}
