package com.internflow.internship;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class InternshipDtos {

    private InternshipDtos() {
    }

    public record InternshipRequest(
            @NotBlank @Size(max = 150) String title,
            @NotBlank @Size(max = 5000) String description,
            @NotBlank @Size(max = 1000) String skillsRequired,
            @Size(max = 150) String location,
            @NotNull WorkMode workMode,
            @NotNull @Min(1) @Max(52) Integer durationWeeks,
            @NotNull @Min(0) @Max(1000000) Integer stipendPerMonth,
            @NotNull @Min(1) @Max(1000) Integer openings,
            @NotNull LocalDate applicationDeadline) {
    }

    public record StatusRequest(@NotNull InternshipStatus status) {
    }

    public record InternshipResponse(
            Long id,
            String title,
            String description,
            String skillsRequired,
            String location,
            WorkMode workMode,
            int durationWeeks,
            int stipendPerMonth,
            int openings,
            LocalDate applicationDeadline,
            InternshipStatus status,
            boolean acceptingApplications,
            String companyName,
            Instant createdAt) {
    }
}