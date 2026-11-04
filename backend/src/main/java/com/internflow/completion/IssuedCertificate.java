package com.internflow.completion;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "certificates")
@Getter
@Setter
@NoArgsConstructor
public class IssuedCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "placement_id", nullable = false, updatable = false, unique = true)
    private Long placementId;

    @Column(name = "student_id", nullable = false, updatable = false)
    private Long studentId;

    @Column(nullable = false, updatable = false, unique = true, length = 20)
    private String code;

    @Column(name = "student_name", nullable = false, updatable = false, length = 150)
    private String studentName;

    @Column(name = "internship_title", nullable = false, updatable = false, length = 150)
    private String internshipTitle;

    @Column(name = "company_name", nullable = false, updatable = false, length = 200)
    private String companyName;

    @Column(name = "start_date", nullable = false, updatable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false, updatable = false)
    private LocalDate endDate;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private Instant issuedAt;

    @PrePersist
    void onCreate() {
        issuedAt = Instant.now();
    }
}