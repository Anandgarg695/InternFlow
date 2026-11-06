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

    public record TestResponse(Long id, int roundNumber, String title, int durationMinutes, boolean locked,
            String roundType, List<QuestionResponse> questions) {
    }

    public record RoundSummary(int roundNumber, String title, int durationMinutes, int questionCount,
            boolean locked, String roundType) {
    }

    public record ResultResponse(Long applicationId, int roundNumber, String studentName, String studentEmail,
            AttemptState state, Integer score, Integer total, Instant submittedAt, String roundType) {
    }

    public record TestResultsResponse(boolean testExists, int totalRounds, List<ResultResponse> results) {
    }

    public record AdvanceResponse(Long applicationId, int currentRound) {
    }

    // Theory company DTOs
    public record TheoryQuestionRequest(
            @NotBlank @Size(max = 2000) String text,
            @NotNull @Min(1) @Max(100) Integer maxScore) {
    }

    public record TheoryTestRequest(
            @NotBlank @Size(max = 150) String title,
            @NotNull @Min(5) @Max(180) Integer durationMinutes,
            @NotNull @Size(min = 1, max = 30, message = "Provide between 1 and 30 questions") @Valid
            List<TheoryQuestionRequest> questions) {
    }

    public record TheoryQuestionResponse(Long id, int sortOrder, String text, int maxScore) {
    }

    public record TheoryTestResponse(Long id, int roundNumber, String title, int durationMinutes, boolean locked,
            List<TheoryQuestionResponse> questions) {
    }

    public record GradeItemRequest(@NotNull Long questionId, @NotNull @Min(0) @Max(100) Integer score,
            @Size(max = 1000) String feedback) {
    }

    public record GradeTheoryRequest(@NotNull List<@Valid GradeItemRequest> grades) {
    }

    public record TheoryAnswerReview(Long questionId, String questionText, int maxScore, String answerText,
            Integer score, String feedback) {
    }

    public record TheorySubmissionReview(Long applicationId, int roundNumber, String studentName,
            List<TheoryAnswerReview> answers, Integer totalScore, Integer maxScore, boolean graded) {
    }

    // ---------------------------------------------------------------- student

    public record TestInfoResponse(AttemptState state, int roundNumber, int totalRounds, String title,
            Integer durationMinutes, Integer questionCount, Integer score, Integer total, String roundType) {
    }

    public record StudentQuestion(String text, List<String> options) {
    }

    public record StartResponse(String title, int durationMinutes, Instant deadlineAt, Instant serverNow,
            List<StudentQuestion> questions) {
    }

    public record SubmitRequest(@NotNull @Size(max = 50) List<Integer> answers) {
    }

    public record SubmitResponse(Integer score, int total) {
    }

    // Theory student DTOs
    public record StudentTheoryQuestion(Long id, String text, int maxScore) {
    }

    public record TheoryStartResponse(String title, int durationMinutes, Instant deadlineAt, Instant serverNow,
            List<StudentTheoryQuestion> questions) {
    }

    public record TheoryAnswerSubmission(@NotNull Long questionId, @NotBlank @Size(max = 4000) String answerText) {
    }

    public record TheorySubmitRequest(@NotNull List<@Valid TheoryAnswerSubmission> answers) {
    }
}
