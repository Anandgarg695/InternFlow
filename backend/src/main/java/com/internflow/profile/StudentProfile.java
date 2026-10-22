package com.internflow.profile;

import java.math.BigDecimal;
import java.time.Instant;

import com.internflow.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 20)
    private String phone;

    @Column(length = 200)
    private String university;

    @Column(length = 150)
    private String degree;

    @Column(length = 150)
    private String branch;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(precision = 4, scale = 2)
    private BigDecimal cgpa;

    @Column(length = 1000)
    private String skills;

    @Column(length = 2000)
    private String bio;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

        public boolean isComplete() {
        return hasText(university) && hasText(degree) && graduationYear != null && hasText(skills);
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}