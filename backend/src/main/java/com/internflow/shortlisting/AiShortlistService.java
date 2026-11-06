package com.internflow.shortlisting;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.application.ApplicationStatus;
import com.internflow.application.InternshipApplication;
import com.internflow.application.InternshipApplicationRepository;
import com.internflow.common.ApiException;
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.notification.NotificationService;
import com.internflow.profile.StudentProfile;
import com.internflow.profile.StudentProfileRepository;
import com.internflow.shortlisting.AiShortlistDtos.AiBatchShortlistRequest;
import com.internflow.shortlisting.AiShortlistDtos.AiBatchShortlistResponse;
import com.internflow.shortlisting.AiShortlistDtos.AiCandidateRanking;
import com.internflow.skillgap.SkillGapDtos.SkillGapAnalysis;
import com.internflow.skillgap.SkillGapService;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class AiShortlistService {

    private final InternshipRepository internshipRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final SkillGapService skillGapService;
    private final NotificationService notifications;

    public AiShortlistService(
            InternshipRepository internshipRepository,
            InternshipApplicationRepository applicationRepository,
            StudentProfileRepository profileRepository,
            UserRepository userRepository,
            SkillGapService skillGapService,
            NotificationService notifications) {
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.skillGapService = skillGapService;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<AiCandidateRanking> rankCandidates(Long companyId, Long internshipId) {
        Internship internship = internshipRepository.findByIdAndCompanyId(internshipId, companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));

        List<InternshipApplication> applications = applicationRepository.findByInternshipIdOrderByCreatedAtDesc(internshipId);
        List<AiCandidateRanking> rankings = new ArrayList<>();

        for (InternshipApplication app : applications) {
            User user = userRepository.findById(app.getStudentId()).orElse(null);
            StudentProfile profile = profileRepository.findByUserId(app.getStudentId()).orElse(null);
            String studentName = user != null ? user.getFullName() : "Applicant";
            String studentEmail = user != null ? user.getEmail() : "";

            SkillGapAnalysis analysis = skillGapService.analyze(
                    profile != null ? profile.getSkills() : "",
                    internship.getSkillsRequired());

            // 1. Skill Fit Score (50%)
            double skillScore = analysis.matchScore() * 0.50;

            // 2. Academic Fit Score (25%)
            double academicPoints = 60.0;
            if (profile != null && profile.getCgpa() != null) {
                academicPoints = Math.min(10.0, profile.getCgpa().doubleValue()) * 8.0;
            }
            if (profile != null && profile.getUniversity() != null && !profile.getUniversity().isBlank()) {
                academicPoints += 20.0;
            }
            double academicScore = Math.min(100.0, academicPoints) * 0.25;

            // 3. Application & Portfolio Strength Score (25%)
            double profilePoints = 0.0;
            if (app.getCoverNote() != null && app.getCoverNote().trim().length() > 20) {
                profilePoints += 40.0;
            } else if (app.getCoverNote() != null && !app.getCoverNote().trim().isEmpty()) {
                profilePoints += 20.0;
            }
            if (profile != null && profile.getBio() != null && !profile.getBio().isBlank()) {
                profilePoints += 20.0;
            }
            if (profile != null && profile.getGithubUrl() != null && !profile.getGithubUrl().isBlank()) {
                profilePoints += 20.0;
            }
            if (profile != null && profile.getLinkedinUrl() != null && !profile.getLinkedinUrl().isBlank()) {
                profilePoints += 20.0;
            }
            double profileScore = Math.min(100.0, profilePoints) * 0.25;

            int finalScore = (int) Math.round(skillScore + academicScore + profileScore);
            finalScore = Math.max(0, Math.min(100, finalScore));

            String recommendation = finalScore >= 75 ? "STRONG_MATCH"
                    : finalScore >= 50 ? "MODERATE_MATCH" : "LOW_MATCH";
            String suggestedAction = finalScore >= 75 ? "SHORTLIST"
                    : finalScore >= 50 ? "REVIEW_MANUALLY" : "REJECT";

            List<String> keyStrengths = new ArrayList<>();
            if (analysis.matchScore() > 0) {
                keyStrengths.add(analysis.matchScore() + "% required skills matched (" + String.join(", ", analysis.matchedSkills()) + ")");
            }
            if (profile != null && profile.getCgpa() != null && profile.getCgpa().compareTo(BigDecimal.valueOf(7.5)) >= 0) {
                keyStrengths.add("Strong academic standing (CGPA: " + profile.getCgpa() + ")");
            }
            if (profile != null && profile.getGithubUrl() != null && !profile.getGithubUrl().isBlank()) {
                keyStrengths.add("Code portfolio linked via GitHub");
            }
            if (app.getCoverNote() != null && app.getCoverNote().trim().length() > 30) {
                keyStrengths.add("Includes detailed cover letter");
            }

            rankings.add(new AiCandidateRanking(
                    app.getId(), app.getStudentId(), studentName, studentEmail, app.getStatus(),
                    finalScore, recommendation, keyStrengths, analysis.missingSkills(),
                    suggestedAction, app.getCurrentRound()));
        }

        rankings.sort(Comparator.comparingInt(AiCandidateRanking::aiScore).reversed());
        return rankings;
    }

    @Transactional
    public AiBatchShortlistResponse batchShortlist(Long companyId, Long internshipId, AiBatchShortlistRequest request) {
        Internship internship = internshipRepository.findByIdAndCompanyId(internshipId, companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));

        List<AiCandidateRanking> rankings = rankCandidates(companyId, internshipId);
        int minScore = request.minScore() > 0 ? request.minScore() : 70;
        int max = request.maxCandidates() != null && request.maxCandidates() > 0 ? request.maxCandidates() : Integer.MAX_VALUE;

        int count = 0;
        for (AiCandidateRanking candidate : rankings) {
            if (count >= max) break;
            if (candidate.status() == ApplicationStatus.APPLIED && candidate.aiScore() >= minScore) {
                InternshipApplication app = applicationRepository.findById(candidate.applicationId()).orElse(null);
                if (app != null) {
                    app.setStatus(ApplicationStatus.SHORTLISTED);
                    if (app.getCurrentRound() == 0) {
                        app.setCurrentRound(1);
                    }
                    applicationRepository.save(app);
                    notifications.send(app.getStudentId(), "Application shortlisted",
                            "Congratulations! Your application for " + internship.getTitle() + " has been shortlisted via AI candidate screening.",
                            "/student/applications");
                    count++;
                }
            }
        }

        return new AiBatchShortlistResponse(count, "Successfully shortlisted " + count + " candidate(s) with AI match score >= " + minScore + "%.");
    }
}
