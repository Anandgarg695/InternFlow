package com.internflow.completion;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.common.ApiException;
import com.internflow.completion.CompletionDtos.CertificateResponse;
import com.internflow.completion.CompletionDtos.CompanyProgressResponse;
import com.internflow.completion.CompletionDtos.EvaluationRequest;
import com.internflow.completion.CompletionDtos.EvaluationResponse;
import com.internflow.completion.CompletionDtos.MentorEvaluationView;
import com.internflow.completion.CompletionDtos.StudentCompletionResponse;
import com.internflow.completion.CompletionDtos.TaskSummary;
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.placement.CompanyNames;
import com.internflow.placement.Placement;
import com.internflow.placement.PlacementRepository;
import com.internflow.task.InternTask;
import com.internflow.task.InternTaskRepository;
import com.internflow.user.User;
import com.internflow.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import com.internflow.notification.NotificationService;

@Service
public class CompletionService {

    @Autowired
    private NotificationService notifications;

    // Dates are calendar dates in Indian time, even though the server runs in UTC
    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    // 32 characters, without the easily confused I, O, 0 and 1
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PlacementRepository placementRepository;
    private final InternshipRepository internshipRepository;
    private final InternTaskRepository taskRepository;
    private final EvaluationRepository evaluationRepository;
    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final CompanyNames companyNames;

    public CompletionService(PlacementRepository placementRepository,
            InternshipRepository internshipRepository,
            InternTaskRepository taskRepository,
            EvaluationRepository evaluationRepository,
            CertificateRepository certificateRepository,
            UserRepository userRepository,
            CompanyNames companyNames) {
        this.placementRepository = placementRepository;
        this.internshipRepository = internshipRepository;
        this.taskRepository = taskRepository;
        this.evaluationRepository = evaluationRepository;
        this.certificateRepository = certificateRepository;
        this.userRepository = userRepository;
        this.companyNames = companyNames;
    }

    // ---------------------------------------------------------------- mentor side

    @Transactional(readOnly = true)
    public MentorEvaluationView mentorView(Long mentorId, Long placementId) {
        Placement placement = mentorPlacement(mentorId, placementId);
        return new MentorEvaluationView(hasEnded(placement), placement.getStatus() == Placement.Status.COMPLETED,
                placement.getEndDate(), summarize(placementId), evaluationOf(placementId));
    }

    @Transactional
    public EvaluationResponse saveEvaluation(Long mentorId, Long placementId, EvaluationRequest request) {
        Placement placement = mentorPlacement(mentorId, placementId);
        if (placement.getStatus() != Placement.Status.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This internship is already completed, so the evaluation is locked");
        }
        if (!hasEnded(placement)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "The final evaluation can be written after the internship ends on " + placement.getEndDate());
        }

        InternEvaluation evaluation = evaluationRepository.findByPlacementId(placementId).orElseGet(() -> {
            InternEvaluation created = new InternEvaluation();
            created.setPlacementId(placementId);
            return created;
        });
        evaluation.setMentorId(mentorId);
        evaluation.setOverallRating(request.overallRating());
        evaluation.setStrengths(request.strengths().trim());
        evaluation.setImprovements(clean(request.improvements()));
        evaluation.setComments(clean(request.comments()));
        evaluationRepository.save(evaluation);
        return toEvaluationResponse(evaluation);
    }

    // ---------------------------------------------------------------- company side

    @Transactional(readOnly = true)
    public CompanyProgressResponse progress(Long companyId, Long placementId) {
        return buildProgress(companyPlacement(companyId, placementId));
    }

    @Transactional
    public CompanyProgressResponse complete(Long companyId, Long placementId) {
        Placement placement = companyPlacement(companyId, placementId);
        String blocker = blocker(placement, summarize(placementId),
                evaluationRepository.findByPlacementId(placementId).isPresent());
        if (blocker != null) {
            throw new ApiException(HttpStatus.CONFLICT, blocker);
        }

        placement.setStatus(Placement.Status.COMPLETED);
        placementRepository.save(placement);
        issueCertificate(placement);
                notifications.send(placement.getStudentId(), "Internship completed",
                "Your internship is complete and your certificate is ready.",
                "/student/placements/" + placement.getId() + "/completion");
        return buildProgress(placement);
    }

    // ---------------------------------------------------------------- student side

    @Transactional(readOnly = true)
    public StudentCompletionResponse studentCompletion(Long studentId, Long placementId) {
        // Not yours, or not completed yet: the answer is the same
        Placement placement = placementRepository.findById(placementId)
                .filter(p -> studentId.equals(p.getStudentId()))
                .filter(p -> p.getStatus() == Placement.Status.COMPLETED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not available"));
        return new StudentCompletionResponse(summarize(placementId), evaluationOf(placementId),
                certificateRepository.findByPlacementId(placement.getId()).map(this::toResponse).orElse(null));
    }

    // ---------------------------------------------------------------- public

    @Transactional(readOnly = true)
    public CertificateResponse verify(String rawCode) {
        String code = rawCode == null ? "" : rawCode.trim().toUpperCase();
        if (code.isEmpty() || code.length() > 20) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Certificate not found");
        }
        return certificateRepository.findByCode(code).map(this::toResponse)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Certificate not found"));
    }

    // ---------------------------------------------------------------- helpers

    // Only the mentor currently assigned to the intern can use it
    private Placement mentorPlacement(Long mentorId, Long placementId) {
        return placementRepository.findById(placementId)
                .filter(p -> mentorId.equals(p.getMentorId()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Intern not found"));
    }

    private Placement companyPlacement(Long companyId, Long placementId) {
        Placement placement = placementRepository.findById(placementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Intern not found"));
        internshipRepository.findByIdAndCompanyId(placement.getInternshipId(), companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Intern not found"));
        return placement;
    }

    private boolean hasEnded(Placement placement) {
        return LocalDate.now(ZONE).isAfter(placement.getEndDate());
    }

    // Returns the reason the internship cannot be completed yet, or null when it can
    private String blocker(Placement placement, TaskSummary tasks, boolean hasEvaluation) {
        if (placement.getStatus() == Placement.Status.COMPLETED) {
            return "This internship is already completed";
        }
        if (placement.getStatus() != Placement.Status.ACTIVE) {
            return "This placement is no longer active";
        }
        if (!hasEnded(placement)) {
            return "The internship ends on " + placement.getEndDate() + ". It can be completed after that day";
        }
        if (placement.getMentorId() == null) {
            return "Assign a mentor first. The mentor writes the final evaluation";
        }
        if (!hasEvaluation) {
            return "The mentor has not written the final evaluation yet";
        }
        if (tasks.waitingForReview() > 0) {
            return tasks.waitingForReview() + " submitted task(s) are still waiting for the mentor's review";
        }
        return null;
    }

    private TaskSummary summarize(Long placementId) {
        List<InternTask> tasks = taskRepository.findByPlacementIdOrderByDueDateAscIdAsc(placementId);
        int toDo = 0;
        int waiting = 0;
        int changes = 0;
        int reviewed = 0;
        int rated = 0;
        double sum = 0;
        for (InternTask task : tasks) {
            switch (task.getStatus()) {
                case ASSIGNED -> toDo++;
                case SUBMITTED -> waiting++;
                case CHANGES_REQUESTED -> changes++;
                case REVIEWED -> {
                    reviewed++;
                    if (task.getRating() != null) {
                        sum += task.getRating();
                        rated++;
                    }
                }
            }
        }
        Double average = rated == 0 ? null : Math.round(sum / rated * 10) / 10.0;
        return new TaskSummary(tasks.size(), toDo, waiting, changes, reviewed, average);
    }

    private EvaluationResponse evaluationOf(Long placementId) {
        return evaluationRepository.findByPlacementId(placementId).map(this::toEvaluationResponse).orElse(null);
    }

    private EvaluationResponse toEvaluationResponse(InternEvaluation e) {
        User mentor = userRepository.findById(e.getMentorId()).orElse(null);
        return new EvaluationResponse(e.getOverallRating(), e.getStrengths(), e.getImprovements(), e.getComments(),
                mentor == null ? null : mentor.getFullName(), e.getUpdatedAt());
    }

    private CertificateResponse toResponse(IssuedCertificate c) {
        return new CertificateResponse(c.getCode(), c.getStudentName(), c.getInternshipTitle(), c.getCompanyName(),
                c.getStartDate(), c.getEndDate(), c.getIssuedAt());
    }

    private CompanyProgressResponse buildProgress(Placement placement) {
        User student = userRepository.findById(placement.getStudentId()).orElse(null);
        Internship internship = internshipRepository.findById(placement.getInternshipId()).orElse(null);
        User mentor = placement.getMentorId() == null ? null
                : userRepository.findById(placement.getMentorId()).orElse(null);
        TaskSummary tasks = summarize(placement.getId());
        EvaluationResponse evaluation = evaluationOf(placement.getId());
        CertificateResponse certificate = certificateRepository.findByPlacementId(placement.getId())
                .map(this::toResponse).orElse(null);
        String blocker = blocker(placement, tasks, evaluation != null);

        return new CompanyProgressResponse(placement.getId(),
                student == null ? null : student.getFullName(),
                student == null ? null : student.getEmail(),
                internship == null ? null : internship.getTitle(),
                placement.getStartDate(), placement.getEndDate(), placement.getStatus().name(),
                mentor == null ? null : mentor.getFullName(),
                tasks, evaluation, certificate, blocker == null, blocker);
    }

    private void issueCertificate(Placement placement) {
        if (certificateRepository.findByPlacementId(placement.getId()).isPresent()) {
            return;
        }
        User student = userRepository.findById(placement.getStudentId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student not found"));
        Internship internship = internshipRepository.findById(placement.getInternshipId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        String company = companyNames.forCompanies(Set.of(internship.getCompanyId())).get(internship.getCompanyId());

        IssuedCertificate certificate = new IssuedCertificate();
        certificate.setPlacementId(placement.getId());
        certificate.setStudentId(student.getId());
        certificate.setCode(newCode());
        certificate.setStudentName(student.getFullName());
        certificate.setInternshipTitle(internship.getTitle());
        certificate.setCompanyName(company == null || company.isBlank() ? "Company" : company);
        certificate.setStartDate(placement.getStartDate());
        certificate.setEndDate(placement.getEndDate());
        certificateRepository.save(certificate);
    }

    private String newCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            StringBuilder code = new StringBuilder("IF");
            for (int group = 0; group < 3; group++) {
                code.append('-');
                for (int i = 0; i < 4; i++) {
                    code.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
                }
            }
            if (!certificateRepository.existsByCode(code.toString())) {
                return code.toString();
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create a certificate code. Try again");
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}