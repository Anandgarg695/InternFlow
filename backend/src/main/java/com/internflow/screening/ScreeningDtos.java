package com.internflow.screening;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ScreeningDtos {

    private ScreeningDtos() {
    }

    // ---------------------------------------------------------------- company

    public record QuestionRequest(
            @NotBlank @Size(max = 1000) String text,
            @NotNull @Size(min = 4, max = 4, message = "Provide exactly 4 options")
            List<@NotBlank @Size(max = 300) String> options,
            @NotNull @Min(0) @Max(3) Integer correctOption) {
    }

    public record TestRequest(
            @NotBlank @Size(max = 150) String title,
            @NotNull @Min(5) @Max(180) Integer durationMinutes,
            @NotNull @Size(min = 1, max = 50, message = "A test needs between 1 and 50 questions") @Valid
            List<QuestionRequest> questions) {
    }

    public record QuestionResponse(String text, List<String> options, int correctOption) {
    }

    public record TestResponse(Long id, String title, int durationMinutes, boolean locked,
            List<QuestionResponse> questions) {
    }

    public record ResultResponse(Long applicationId, String studentName, String studentEmail,
            AttemptState state, Integer score, Integer total, Instant submittedAt) {
    }

    public record TestResultsResponse(boolean testExists, List<ResultResponse> results) {
    }

    // ---------------------------------------------------------------- student

    public record TestInfoResponse(AttemptState state, String title, Integer durationMinutes,
            Integer questionCount, Integer score, Integer total) {
    }

    // Deliberately has no correct answer
    public record StudentQuestion(String text, List<String> options) {
    }

    public record StartResponse(String title, int durationMinutes, Instant deadlineAt, Instant serverNow,
            List<StudentQuestion> questions) {
    }

    public record SubmitRequest(@NotNull @Size(max = 50) List<Integer> answers) {
    }

    public record SubmitResponse(int score, int total) {
    }
}