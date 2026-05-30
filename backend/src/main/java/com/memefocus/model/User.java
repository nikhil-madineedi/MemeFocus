package com.memefocus.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private int currentStreak = 0;
    private int longestStreak = 0;
    private int defaultFocusDuration = 25;
    private int defaultBreakDuration = 5;

    public User() {}

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.currentStreak = 0;
        this.longestStreak = 0;
        this.defaultFocusDuration = 25;
        this.defaultBreakDuration = 5;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = longestStreak;
    }

    public int getDefaultFocusDuration() {
        return defaultFocusDuration;
    }

    public void setDefaultFocusDuration(int defaultFocusDuration) {
        this.defaultFocusDuration = defaultFocusDuration;
    }

    public int getDefaultBreakDuration() {
        return defaultBreakDuration;
    }

    public void setDefaultBreakDuration(int defaultBreakDuration) {
        this.defaultBreakDuration = defaultBreakDuration;
    }
}
