package com.internflow.completion;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CompletionDtos {

    private CompletionDtos() {
    }

    public record EvaluationRequest(
            @NotNull @Min(1) @Max(5) Integer overallRating,
            @NotBlank @Size(max = 1000) String strengths,
            @Size(max = 1000) String improvements,
            @Size(max = 2000) String comments) {
    }

    public record TaskSummary(int total, int toDo, int waitingForReview, int changesRequested, int reviewed,
            Double averageRating) {
    }

    public record EvaluationResponse(int overallRating, String strengths, String improvements, String comments,
            String mentorName, Instant updatedAt) {
    }

    // The public verification page returns exactly these fields and nothing else
    public record CertificateResponse(String code, String studentName, String internshipTitle, String companyName,
            LocalDate startDate, LocalDate endDate, Instant issuedAt) {
    }

    public record MentorEvaluationView(boolean ended, boolean completed, LocalDate endDate, TaskSummary tasks,
            EvaluationResponse evaluation) {
    }

    public record CompanyProgressResponse(Long placementId, String studentName, String studentEmail,
            String internshipTitle, LocalDate startDate, LocalDate endDate, String status, String mentorName,
            TaskSummary tasks, EvaluationResponse evaluation, CertificateResponse certificate,
            boolean canComplete, String blockReason) {
    }

    public record StudentCompletionResponse(TaskSummary tasks, EvaluationResponse evaluation,
            CertificateResponse certificate) {
    }
}
