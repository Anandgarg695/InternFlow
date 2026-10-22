package com.internflow.application;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ApplicationDtos {

    private ApplicationDtos() {
    }

    // What a company is allowed to decide (nothing else can be set from outside)
    public enum Decision {
        SHORTLISTED, REJECTED
    }

    public record ApplyRequest(
            @NotNull Long internshipId,
            @Size(max = 2000) String coverNote) {
    }

    public record DecisionRequest(@NotNull Decision status) {
    }

    public record StudentApplicationResponse(
            Long id,
            Long internshipId,
            String internshipTitle,
            String companyName,
            ApplicationStatus status,
            String coverNote,
            Instant appliedAt) {
    }

    public record ApplicantResponse(
            Long id,
            ApplicationStatus status,
            String coverNote,
            Instant appliedAt,
            String studentName,
            String studentEmail,
            String phone,
            String university,
            String degree,
            String branch,
            Integer graduationYear,
            BigDecimal cgpa,
            String skills,
            String bio,
            String linkedinUrl,
            String githubUrl) {
    }
}