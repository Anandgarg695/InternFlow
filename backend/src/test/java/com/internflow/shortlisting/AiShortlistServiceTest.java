package com.internflow.shortlisting;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.internflow.application.ApplicationStatus;
import com.internflow.application.InternshipApplication;
import com.internflow.application.InternshipApplicationRepository;
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.notification.NotificationService;
import com.internflow.profile.StudentProfile;
import com.internflow.profile.StudentProfileRepository;
import com.internflow.shortlisting.AiShortlistDtos.AiCandidateRanking;
import com.internflow.skillgap.SkillGapDtos.SkillGapAnalysis;
import com.internflow.skillgap.SkillGapService;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

class AiShortlistServiceTest {

    private InternshipRepository internshipRepo;
    private InternshipApplicationRepository applicationRepo;
    private StudentProfileRepository profileRepo;
    private UserRepository userRepo;
    private SkillGapService skillGapService;
    private NotificationService notifications;
    private AiShortlistService service;

    @BeforeEach
    void setUp() {
        internshipRepo = Mockito.mock(InternshipRepository.class);
        applicationRepo = Mockito.mock(InternshipApplicationRepository.class);
        profileRepo = Mockito.mock(StudentProfileRepository.class);
        userRepo = Mockito.mock(UserRepository.class);
        skillGapService = Mockito.mock(SkillGapService.class);
        notifications = Mockito.mock(NotificationService.class);

        service = new AiShortlistService(
                internshipRepo, applicationRepo, profileRepo,
                userRepo, skillGapService, notifications);
    }

    @Test
    void testCandidateRankingCalculation() {
        Long companyId = 1L;
        Long internshipId = 10L;

        Internship internship = new Internship();
        internship.setId(internshipId);
        internship.setCompanyId(companyId);
        internship.setTitle("Full Stack Intern");
        internship.setSkillsRequired("React, Java, Spring Boot");

        when(internshipRepo.findByIdAndCompanyId(internshipId, companyId))
                .thenReturn(Optional.of(internship));

        InternshipApplication app = new InternshipApplication();
        app.setId(100L);
        app.setInternshipId(internshipId);
        app.setStudentId(2L);
        app.setStatus(ApplicationStatus.APPLIED);
        app.setCoverNote("I am passionate about full stack development and building reliable web systems.");

        when(applicationRepo.findByInternshipIdOrderByCreatedAtDesc(internshipId))
                .thenReturn(List.of(app));

        User user = new User();
        user.setId(2L);
        user.setFullName("Akash");
        user.setEmail("akash@example.com");
        when(userRepo.findById(2L)).thenReturn(Optional.of(user));

        StudentProfile profile = new StudentProfile();
        profile.setSkills("React, Java, Spring Boot");
        profile.setCgpa(BigDecimal.valueOf(9.0));
        profile.setUniversity("IIT");
        profile.setGithubUrl("https://github.com/akash");
        when(profileRepo.findByUserId(2L)).thenReturn(Optional.of(profile));

        when(skillGapService.analyze(any(), any()))
                .thenReturn(new SkillGapAnalysis(100, List.of("React", "Java", "Spring Boot"), List.of(), List.of()));

        List<AiCandidateRanking> rankings = service.rankCandidates(companyId, internshipId);

        assertFalse(rankings.isEmpty());
        AiCandidateRanking top = rankings.get(0);
        assertEquals(100L, top.applicationId());
        assertTrue(top.aiScore() >= 80);
        assertEquals("STRONG_MATCH", top.recommendation());
        assertEquals("SHORTLIST", top.suggestedAction());
        assertFalse(top.keyStrengths().isEmpty());
    }
}
