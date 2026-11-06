package com.internflow.skillgap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.internflow.application.InternshipApplicationRepository;
import com.internflow.internship.InternshipRepository;
import com.internflow.profile.StudentProfileRepository;
import com.internflow.skillgap.SkillGapDtos.SkillGapAnalysis;

class SkillGapServiceTest {

    private SkillGapService service;

    @BeforeEach
    void setUp() {
        StudentProfileRepository profileRepo = Mockito.mock(StudentProfileRepository.class);
        InternshipRepository internshipRepo = Mockito.mock(InternshipRepository.class);
        InternshipApplicationRepository appRepo = Mockito.mock(InternshipApplicationRepository.class);
        service = new SkillGapService(profileRepo, internshipRepo, appRepo);
    }

    @Test
    void testExactAndPartialSkillMatches() {
        String studentSkills = "React.js, Spring Boot, PostgreSQL, Docker";
        String requiredSkills = "React, Java, SpringBoot, AWS";

        SkillGapAnalysis result = service.analyze(studentSkills, requiredSkills);

        assertEquals(50, result.matchScore()); // 2 out of 4 (React, SpringBoot)
        assertTrue(result.matchedSkills().contains("React"));
        assertTrue(result.matchedSkills().contains("SpringBoot"));
        assertTrue(result.missingSkills().contains("Java"));
        assertTrue(result.missingSkills().contains("AWS"));
        assertFalse(result.recommendations().isEmpty());
    }

    @Test
    void testEmptyRequiredSkillsReturnsPerfectScore() {
        SkillGapAnalysis result = service.analyze("Python, Git", "");
        assertEquals(100, result.matchScore());
        assertTrue(result.matchedSkills().isEmpty());
        assertTrue(result.missingSkills().isEmpty());
    }
}
