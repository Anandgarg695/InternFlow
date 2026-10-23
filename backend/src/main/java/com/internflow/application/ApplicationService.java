package com.internflow.application;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.application.ApplicationDtos.ApplicantResponse;
import com.internflow.application.ApplicationDtos.ApplyRequest;
import com.internflow.application.ApplicationDtos.Decision;
import com.internflow.application.ApplicationDtos.StudentApplicationResponse;
import com.internflow.common.ApiException;
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.internship.InternshipService;
import com.internflow.profile.CompanyProfile;
import com.internflow.profile.CompanyProfileRepository;
import com.internflow.profile.StudentProfile;
import com.internflow.profile.StudentProfileRepository;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class ApplicationService {

    private final InternshipApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final InternshipService internshipService;
    private final StudentProfileRepository studentProfileRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;

    public ApplicationService(InternshipApplicationRepository applicationRepository,
            InternshipRepository internshipRepository,
            InternshipService internshipService,
            StudentProfileRepository studentProfileRepository,
            CompanyProfileRepository companyProfileRepository,
            UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.internshipRepository = internshipRepository;
        this.internshipService = internshipService;
        this.studentProfileRepository = studentProfileRepository;
        this.companyProfileRepository = companyProfileRepository;
        this.userRepository = userRepository;
    }

    // ---------------------------------------------------------------- student side

    @Transactional
    public StudentApplicationResponse apply(Long studentId, ApplyRequest request) {
        Internship internship = internshipService.requireAcceptingApplications(request.internshipId());

        StudentProfile profile = studentProfileRepository.findByUserId(studentId).orElse(null);
        if (profile == null || !profile.isComplete()) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Complete your profile before applying (university, degree, graduation year and skills)");
        }
        if (applicationRepository.existsByInternshipIdAndStudentId(internship.getId(), studentId)) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already applied to this internship");
        }

        InternshipApplication application = new InternshipApplication();
        application.setInternshipId(internship.getId());
        application.setStudentId(studentId);
        application.setCoverNote(clean(request.coverNote()));
        application.setStatus(ApplicationStatus.APPLIED);
        applicationRepository.save(application);
        return toStudentResponses(List.of(application)).get(0);
    }

    @Transactional(readOnly = true)
    public List<StudentApplicationResponse> listOwn(Long studentId) {
        return toStudentResponses(applicationRepository.findByStudentIdOrderByCreatedAtDesc(studentId));
    }

    @Transactional
    public StudentApplicationResponse withdraw(Long studentId, Long applicationId) {
        // Someone else's application looks exactly like a missing one
        InternshipApplication application = applicationRepository.findByIdAndStudentId(applicationId, studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));

        if (application.getStatus() != ApplicationStatus.APPLIED
                && application.getStatus() != ApplicationStatus.SHORTLISTED) {
            throw new ApiException(HttpStatus.CONFLICT, "This application can no longer be withdrawn");
        }
        application.setStatus(ApplicationStatus.WITHDRAWN);
        applicationRepository.save(application);
        return toStudentResponses(List.of(application)).get(0);
    }

    // ---------------------------------------------------------------- company side

    @Transactional(readOnly = true)
    public List<ApplicantResponse> listApplicants(Long companyId, Long internshipId) {
        internshipRepository.findByIdAndCompanyId(internshipId, companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        return toApplicantResponses(applicationRepository.findByInternshipIdOrderByCreatedAtDesc(internshipId));
    }

    @Transactional
    public ApplicantResponse decide(Long companyId, Long applicationId, Decision decision) {
        InternshipApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        internshipRepository.findByIdAndCompanyId(application.getInternshipId(), companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));

        if (application.getStatus() == ApplicationStatus.WITHDRAWN) {
            throw new ApiException(HttpStatus.CONFLICT, "The student withdrew this application");
        }
        ApplicationStatus target = ApplicationStatus.valueOf(decision.name());
        if (application.getStatus() != target) {
            application.setStatus(target);
            if (target == ApplicationStatus.SHORTLISTED && application.getCurrentRound() == 0) {
                application.setCurrentRound(1);
            }
            applicationRepository.save(application);
        }
        return toApplicantResponses(List.of(application)).get(0);
    }

    // ---------------------------------------------------------------- helpers

    private List<StudentApplicationResponse> toStudentResponses(List<InternshipApplication> applications) {
        Set<Long> internshipIds = applications.stream()
                .map(InternshipApplication::getInternshipId)
                .collect(Collectors.toSet());
        Map<Long, Internship> internships = internshipRepository.findAllById(internshipIds).stream()
                .collect(Collectors.toMap(Internship::getId, Function.identity()));

        Set<Long> companyIds = internships.values().stream()
                .map(Internship::getCompanyId)
                .collect(Collectors.toSet());
        Map<Long, String> companyNames = new HashMap<>();
        if (!companyIds.isEmpty()) {
            for (CompanyProfile profile : companyProfileRepository.findByUserIdIn(companyIds)) {
                companyNames.put(profile.getUser().getId(), profile.getCompanyName());
            }
        }

        return applications.stream().map(a -> {
            Internship internship = internships.get(a.getInternshipId());
            return new StudentApplicationResponse(a.getId(), a.getInternshipId(),
                    internship == null ? null : internship.getTitle(),
                    internship == null ? null : companyNames.get(internship.getCompanyId()),
                    a.getStatus(), a.getCoverNote(), a.getCreatedAt(), a.getCurrentRound());
        }).toList();
    }

    private List<ApplicantResponse> toApplicantResponses(List<InternshipApplication> applications) {
        Set<Long> studentIds = applications.stream()
                .map(InternshipApplication::getStudentId)
                .collect(Collectors.toSet());
        Map<Long, User> users = userRepository.findAllById(studentIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, StudentProfile> profiles = new HashMap<>();
        if (!studentIds.isEmpty()) {
            for (StudentProfile profile : studentProfileRepository.findByUserIdIn(studentIds)) {
                profiles.put(profile.getUser().getId(), profile);
            }
        }

        return applications.stream().map(a -> {
            User user = users.get(a.getStudentId());
            StudentProfile p = profiles.get(a.getStudentId());
            return new ApplicantResponse(a.getId(), a.getStatus(), a.getCoverNote(), a.getCreatedAt(),
                    user == null ? null : user.getFullName(),
                    user == null ? null : user.getEmail(),
                    p == null ? null : p.getPhone(),
                    p == null ? null : p.getUniversity(),
                    p == null ? null : p.getDegree(),
                    p == null ? null : p.getBranch(),
                    p == null ? null : p.getGraduationYear(),
                    p == null ? null : p.getCgpa(),
                    p == null ? null : p.getSkills(),
                    p == null ? null : p.getBio(),
                    p == null ? null : p.getLinkedinUrl(),
                    p == null ? null : p.getGithubUrl(),
                    a.getCurrentRound());
        }).toList();
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}