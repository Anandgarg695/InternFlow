package com.internflow.interview;

import java.time.Instant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class InterviewDtos {

    private InterviewDtos() {
    }

    // Used both to schedule and to reschedule. Empty fields are sent as null.
    public record InterviewRequest(
            @NotNull Interview.Type type,
            @NotNull Interview.Mode mode,
            @NotNull Instant scheduledAt,
            @NotNull @Min(15) @Max(180) Integer durationMinutes,
            @Pattern(regexp = "^https://.{3,}$", message = "Meeting link must start with https://")
            @Size(max = 500) String meetingLink,
            @Size(max = 200) String location,
            @Size(max = 1000) String notes) {
    }

    public record CompleteRequest(
            @NotNull Interview.Outcome outcome,
            @Size(max = 1000) String feedback) {
    }

    public record RescheduleRequest(@NotBlank @Size(max = 500) String reason) {
    }

    // Everything the company needs, including the private outcome and feedback
    public record CompanyInterviewResponse(
            Long id,
            Long applicationId,
            String studentName,
            int roundNumber,
            Interview.Type type,
            Interview.Mode mode,
            Instant scheduledAt,
            int durationMinutes,
            String meetingLink,
            String location,
            String notes,
            Interview.Status status,
            String rescheduleReason,
            Interview.Outcome outcome,
            String feedback) {
    }

    // Deliberately has no outcome and no feedback
    public record StudentInterviewResponse(
            Long id,
            Long applicationId,
            String internshipTitle,
            String companyName,
            int roundNumber,
            Interview.Type type,
            Interview.Mode mode,
            Instant scheduledAt,
            int durationMinutes,
            String meetingLink,
            String location,
            String notes,
            Interview.Status status,
            String rescheduleReason) {
    }
}