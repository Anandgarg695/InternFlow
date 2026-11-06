package com.internflow.skillgap;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.skillgap.SkillGapDtos.InternshipMatchScore;
import com.internflow.skillgap.SkillGapDtos.SkillGapAnalysis;

@RestController
@RequestMapping("/api/student/skillgap")
public class StudentSkillGapController {

    private final SkillGapService skillGapService;

    public StudentSkillGapController(SkillGapService skillGapService) {
        this.skillGapService = skillGapService;
    }

    @GetMapping("/internship/{internshipId}")
    public SkillGapAnalysis analyzeInternship(@AuthenticationPrincipal Jwt jwt, @PathVariable("internshipId") Long internshipId) {
        Long studentId = Long.valueOf(jwt.getSubject());
        return skillGapService.analyzeForStudent(studentId, internshipId);
    }

    @GetMapping("/scores")
    public List<InternshipMatchScore> getScores(@AuthenticationPrincipal Jwt jwt) {
        Long studentId = Long.valueOf(jwt.getSubject());
        return skillGapService.batchScoresForStudent(studentId);
    }
}
