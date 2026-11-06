package com.internflow.shortlisting;

import java.util.List;

import com.internflow.application.ApplicationStatus;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public final class AiShortlistDtos {

    private AiShortlistDtos() {
    }

    public record AiCandidateRanking(
            Long applicationId,
            Long studentId,
            String studentName,
            String studentEmail,
            ApplicationStatus status,
            int aiScore,
            String recommendation,
            List<String> keyStrengths,
            List<String> missingSkills,
            String suggestedAction,
            int currentRound) {
    }

    public record AiBatchShortlistRequest(
            @Min(0) @Max(100) int minScore,
            Integer maxCandidates) {
    }

    public record AiBatchShortlistResponse(
            int shortlistedCount,
            String message) {
    }
}
