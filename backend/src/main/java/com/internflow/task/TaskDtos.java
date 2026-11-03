package com.internflow.task;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class TaskDtos {

    private TaskDtos() {
    }

    public enum Decision { APPROVE, REQUEST_CHANGES }

    public record TaskRequest(
            @NotBlank @Size(max = 150) String title,
            @NotBlank @Size(max = 2000) String description,
            @NotNull LocalDate dueDate) {
    }

    // Empty fields are sent as null. Only https links are accepted.
    public record SubmissionRequest(
            @NotBlank @Size(max = 4000) String text,
            @Pattern(regexp = "^https://.{3,}$", message = "The link must start with https://")
            @Size(max = 500) String link) {
    }

    public record ReviewRequest(
            @NotNull Decision decision,
            @Min(1) @Max(5) Integer rating,
            @Size(max = 2000) String feedback) {
    }

    public record TaskResponse(
            Long id,
            Long placementId,
            String title,
            String description,
            LocalDate dueDate,
            InternTask.Status status,
            String submissionText,
            String submissionLink,
            Instant submittedAt,
            boolean late,
            Integer rating,
            String feedback,
            Instant reviewedAt) {
    }
}