package com.example.time_manager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "char(36)")
    private String id;

    private String firstName;
    private String lastName;

    @Column(unique = true)
    private String email;

    private String phone;
    private String role;
    private String poste;
    private String password;
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;
    private String azureOid;
    // === Constructors ===

    public User() {
    }

    public User(String id, String firstName, String lastName, String email, String phone, String role, String poste, String password, String azureOid) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.poste = poste;
        this.password = password;
        this.azureOid = azureOid;
    }

    // === Getters & Setters ===

    public String getId() {return id;}
    public void setId(String id) {this.id = id;}

    public String getFirstName() {return firstName;}
    public void setFirstName(String firstName) {this.firstName = firstName;}

    public String getLastName() {return lastName;}
    public void setLastName(String lastName) {this.lastName = lastName;}

    public String getEmail() {return email;}
    public void setEmail(String email) {this.email = email;}

    public String getPhone() {return phone;}
    public void setPhone(String phone) {this.phone = phone;}

    public String getRole() {return role;}
    public void setRole(String role) {this.role = role;}

    public String getPoste() {return poste;}
    public void setPoste(String poste) {this.poste = poste;}

    public String getPassword() {return password;}
    public void setPassword(String password) {this.password = password;}

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getAzureOid() { return azureOid; }
    public void setAzureOid(String azureOid) { this.azureOid = azureOid; }


}
