package com.internflow.interview;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.application.ApplicationStatus;
import com.internflow.application.InternshipApplication;
import com.internflow.application.InternshipApplicationRepository;
import com.internflow.common.ApiException;
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.interview.InterviewDtos.CompanyInterviewResponse;
import com.internflow.interview.InterviewDtos.CompleteRequest;
import com.internflow.interview.InterviewDtos.InterviewRequest;
import com.internflow.interview.InterviewDtos.StudentInterviewResponse;
import com.internflow.profile.CompanyProfile;
import com.internflow.profile.CompanyProfileRepository;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class InterviewService {

    private static final List<Interview.Status> ACTIVE = List.of(
            Interview.Status.SCHEDULED, Interview.Status.CONFIRMED, Interview.Status.RESCHEDULE_REQUESTED);

    private final InterviewRepository interviewRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final UserRepository userRepository;
    private final CompanyProfileRepository companyProfileRepository;

    public InterviewService(InterviewRepository interviewRepository,
            InternshipApplicationRepository applicationRepository,
            InternshipRepository internshipRepository,
            UserRepository userRepository,
            CompanyProfileRepository companyProfileRepository) {
        this.interviewRepository = interviewRepository;
        this.applicationRepository = applicationRepository;
        this.internshipRepository = internshipRepository;
        this.userRepository = userRepository;
        this.companyProfileRepository = companyProfileRepository;
    }

    // ---------------------------------------------------------------- company side

    @Transactional
    public CompanyInterviewResponse schedule(Long companyId, Long applicationId, InterviewRequest request) {
        InternshipApplication application = ownedApplication(companyId, applicationId);
        if (application.getStatus() != ApplicationStatus.SHORTLISTED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only shortlisted applicants can be interviewed");
        }
        validate(request);
        if (interviewRepository.existsByApplicationIdAndStatusIn(applicationId, ACTIVE)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This applicant already has an active interview. Complete or cancel it first");
        }
        checkAvailability(application.getStudentId(), request.scheduledAt(), request.durationMinutes(), null);

        Interview interview = new Interview();
        interview.setApplicationId(applicationId);
        interview.setStudentId(application.getStudentId());
        interview.setRoundNumber(Math.max(application.getCurrentRound(), 1));
        interview.setStatus(Interview.Status.SCHEDULED);
        apply(interview, request);
        interviewRepository.save(interview);
        return toCompanyResponses(List.of(interview)).get(0);
    }

    @Transactional(readOnly = true)
    public List<CompanyInterviewResponse> listForInternship(Long companyId, Long internshipId) {
        internshipRepository.findByIdAndCompanyId(internshipId, companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        List<Long> applicationIds = applicationRepository.findByInternshipIdOrderByCreatedAtDesc(internshipId)
                .stream().map(InternshipApplication::getId).toList();
        if (applicationIds.isEmpty()) {
            return List.of();
        }
        return toCompanyResponses(interviewRepository.findByApplicationIdInOrderByScheduledAtDesc(applicationIds));
    }

    @Transactional
    public CompanyInterviewResponse reschedule(Long companyId, Long interviewId, InterviewRequest request) {
        Interview interview = ownedInterview(companyId, interviewId);
        requireActive(interview, "Only active interviews can be changed");
        validate(request);
        checkAvailability(interview.getStudentId(), request.scheduledAt(), request.durationMinutes(),
                interview.getId());

        apply(interview, request);
        interview.setStatus(Interview.Status.SCHEDULED);
        interview.setRescheduleReason(null);
        interviewRepository.save(interview);
        return toCompanyResponses(List.of(interview)).get(0);
    }

    @Transactional
    public CompanyInterviewResponse cancel(Long companyId, Long interviewId) {
        Interview interview = ownedInterview(companyId, interviewId);
        requireActive(interview, "Only active interviews can be cancelled");
        interview.setStatus(Interview.Status.CANCELLED);
        interviewRepository.save(interview);
        return toCompanyResponses(List.of(interview)).get(0);
    }

    @Transactional
    public CompanyInterviewResponse complete(Long companyId, Long interviewId, CompleteRequest request) {
        Interview interview = ownedInterview(companyId, interviewId);
        requireActive(interview, "Only active interviews can be completed");
        if (Instant.now().isBefore(interview.getScheduledAt())) {
            throw new ApiException(HttpStatus.CONFLICT, "The interview has not started yet");
        }
        interview.setStatus(Interview.Status.COMPLETED);
        interview.setOutcome(request.outcome());
        interview.setFeedback(clean(request.feedback()));
        interviewRepository.save(interview);
        return toCompanyResponses(List.of(interview)).get(0);
    }

    // ---------------------------------------------------------------- student side

    @Transactional(readOnly = true)
    public List<StudentInterviewResponse> listOwn(Long studentId) {
        List<Interview> all = interviewRepository.findByStudentIdOrderByScheduledAtAsc(studentId);
        if (all.isEmpty()) {
            return List.of();
        }
        Map<Long, InternshipApplication> applications = applicationsById(all);

        // Active interviews of withdrawn or rejected applications are hidden
        List<Interview> visible = all.stream().filter(i -> {
            if (!ACTIVE.contains(i.getStatus())) {
                return true;
            }
            InternshipApplication a = applications.get(i.getApplicationId());
            return a != null && a.getStatus() == ApplicationStatus.SHORTLISTED;
        }).toList();

        Map<Long, Internship> internships = internshipRepository
                .findAllById(applications.values().stream().map(InternshipApplication::getInternshipId)
                        .collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Internship::getId, Function.identity()));

        Map<Long, String> companyNames = new HashMap<>();
        Set<Long> companyIds = internships.values().stream().map(Internship::getCompanyId)
                .collect(Collectors.toSet());
        if (!companyIds.isEmpty()) {
            for (CompanyProfile profile : companyProfileRepository.findByUserIdIn(companyIds)) {
                companyNames.put(profile.getUser().getId(), profile.getCompanyName());
            }
        }

        return visible.stream().map(i -> {
            InternshipApplication a = applications.get(i.getApplicationId());
            Internship internship = a == null ? null : internships.get(a.getInternshipId());
            return new StudentInterviewResponse(i.getId(), i.getApplicationId(),
                    internship == null ? null : internship.getTitle(),
                    internship == null ? null : companyNames.get(internship.getCompanyId()),
                    i.getRoundNumber(), i.getType(), i.getMode(), i.getScheduledAt(), i.getDurationMinutes(),
                    i.getMeetingLink(), i.getLocation(), i.getNotes(), i.getStatus(), i.getRescheduleReason());
        }).toList();
    }

    @Transactional
    public void confirm(Long studentId, Long interviewId) {
        Interview interview = ownLiveInterview(studentId, interviewId);
        if (interview.getStatus() != Interview.Status.SCHEDULED) {
            throw new ApiException(HttpStatus.CONFLICT, "This interview cannot be confirmed");
        }
        requireInFuture(interview);
        interview.setStatus(Interview.Status.CONFIRMED);
        interviewRepository.save(interview);
    }

    @Transactional
    public void requestReschedule(Long studentId, Long interviewId, String reason) {
        Interview interview = ownLiveInterview(studentId, interviewId);
        if (interview.getStatus() != Interview.Status.SCHEDULED
                && interview.getStatus() != Interview.Status.CONFIRMED) {
            throw new ApiException(HttpStatus.CONFLICT, "A new time cannot be requested for this interview");
        }
        requireInFuture(interview);
        interview.setStatus(Interview.Status.RESCHEDULE_REQUESTED);
        interview.setRescheduleReason(reason.trim());
        interviewRepository.save(interview);
    }

    // ---------------------------------------------------------------- helpers

    private InternshipApplication ownedApplication(Long companyId, Long applicationId) {
        // Someone else's application looks exactly like a missing one
        InternshipApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        internshipRepository.findByIdAndCompanyId(application.getInternshipId(), companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        return application;
    }

    private Interview ownedInterview(Long companyId, Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Interview not found"));
        InternshipApplication application = applicationRepository.findById(interview.getApplicationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Interview not found"));
        internshipRepository.findByIdAndCompanyId(application.getInternshipId(), companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Interview not found"));
        return interview;
    }

    private Interview ownLiveInterview(Long studentId, Long interviewId) {
        Interview interview = interviewRepository.findByIdAndStudentId(interviewId, studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Interview not found"));
        InternshipApplication application = applicationRepository.findById(interview.getApplicationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Interview not found"));
        if (application.getStatus() != ApplicationStatus.SHORTLISTED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Interview not found");
        }
        return interview;
    }

    private void requireActive(Interview interview, String message) {
        if (!ACTIVE.contains(interview.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, message);
        }
    }

    private void requireInFuture(Interview interview) {
        if (!interview.getScheduledAt().isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.CONFLICT, "The time of this interview has already passed");
        }
    }

    private void validate(InterviewRequest r) {
        if (!r.scheduledAt().isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The interview must be scheduled in the future");
        }
        if (r.mode() == Interview.Mode.ONLINE && isBlank(r.meetingLink())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A meeting link is required for online interviews");
        }
        if (r.mode() == Interview.Mode.ONSITE && isBlank(r.location())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A location is required for on-site interviews");
        }
    }

    private void apply(Interview i, InterviewRequest r) {
        i.setType(r.type());
        i.setMode(r.mode());
        i.setScheduledAt(r.scheduledAt());
        i.setDurationMinutes(r.durationMinutes());
        i.setMeetingLink(r.mode() == Interview.Mode.ONLINE ? clean(r.meetingLink()) : null);
        i.setLocation(r.mode() == Interview.Mode.ONSITE ? clean(r.location()) : null);
        i.setNotes(clean(r.notes()));
    }

    // The student must not have another live interview that overlaps this time slot
    private void checkAvailability(Long studentId, Instant start, int minutes, Long ignoreInterviewId) {
        Instant end = start.plus(minutes, ChronoUnit.MINUTES);

        List<Interview> active = interviewRepository.findByStudentIdAndStatusIn(studentId, ACTIVE);
        if (active.isEmpty()) {
            return;
        }
        Map<Long, InternshipApplication> applications = applicationsById(active);

        for (Interview other : active) {
            if (ignoreInterviewId != null && other.getId().equals(ignoreInterviewId)) {
                continue;
            }
            InternshipApplication a = applications.get(other.getApplicationId());
            if (a == null || a.getStatus() != ApplicationStatus.SHORTLISTED) {
                continue; // belongs to a withdrawn or rejected application
            }
            Instant otherEnd = other.getScheduledAt().plus(other.getDurationMinutes(), ChronoUnit.MINUTES);
            if (start.isBefore(otherEnd) && end.isAfter(other.getScheduledAt())) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "The student is not available at that time. Choose another time slot");
            }
        }
    }

    private Map<Long, InternshipApplication> applicationsById(List<Interview> interviews) {
        return applicationRepository
                .findAllById(interviews.stream().map(Interview::getApplicationId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(InternshipApplication::getId, Function.identity()));
    }

    private List<CompanyInterviewResponse> toCompanyResponses(List<Interview> interviews) {
        Map<Long, User> users = userRepository
                .findAllById(interviews.stream().map(Interview::getStudentId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return interviews.stream().map(i -> {
            User student = users.get(i.getStudentId());
            return new CompanyInterviewResponse(i.getId(), i.getApplicationId(),
                    student == null ? null : student.getFullName(),
                    i.getRoundNumber(), i.getType(), i.getMode(), i.getScheduledAt(), i.getDurationMinutes(),
                    i.getMeetingLink(), i.getLocation(), i.getNotes(), i.getStatus(), i.getRescheduleReason(),
                    i.getOutcome(), i.getFeedback());
        }).toList();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}