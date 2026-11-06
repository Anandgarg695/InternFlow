package com.internflow.skillgap;

import java.util.List;

public class SkillGapDtos {

    public record SkillRecommendation(String skill, String suggestion, String resourceUrl) {}

    public record SkillGapAnalysis(
            int matchScore,
            List<String> matchedSkills,
            List<String> missingSkills,
            List<SkillRecommendation> recommendations
    ) {}

    public record InternshipMatchScore(
            Long internshipId,
            int matchScore
    ) {}
}
