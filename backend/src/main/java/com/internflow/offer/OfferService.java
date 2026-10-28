package com.internflow.offer;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.application.ApplicationStatus;
import com.internflow.application.InternshipApplication;
import com.internflow.application.InternshipApplicationRepository;
import com.internflow.common.ApiException;
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.internship.InternshipStatus;
import com.internflow.interview.Interview;
import com.internflow.interview.InterviewRepository;
import com.internflow.offer.OfferDtos.CompanyOfferResponse;
import com.internflow.offer.OfferDtos.OfferRequest;
import com.internflow.offer.OfferDtos.StudentOfferResponse;
import com.internflow.profile.CompanyProfile;
import com.internflow.profile.CompanyProfileRepository;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class OfferService {

    // Dates are calendar dates in Indian time, even though the server runs in UTC
    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private static final List<Offer.Status> TAKES_A_SLOT = List.of(Offer.Status.OFFERED, Offer.Status.ACCEPTED);
    private static final List<Interview.Status> ACTIVE_INTERVIEW = List.of(
            Interview.Status.SCHEDULED, Interview.Status.CONFIRMED, Interview.Status.RESCHEDULE_REQUESTED);

    private final OfferRepository offerRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final InterviewRepository interviewRepository;
    private final UserRepository userRepository;
    private final CompanyProfileRepository companyProfileRepository;

    public OfferService(OfferRepository offerRepository,
            InternshipApplicationRepository applicationRepository,
            InternshipRepository internshipRepository,
            InterviewRepository interviewRepository,
            UserRepository userRepository,
            CompanyProfileRepository companyProfileRepository) {
        this.offerRepository = offerRepository;
        this.applicationRepository = applicationRepository;
        this.internshipRepository = internshipRepository;
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.companyProfileRepository = companyProfileRepository;
    }

    // ---------------------------------------------------------------- company side

    @Transactional
    public CompanyOfferResponse make(Long companyId, Long applicationId, OfferRequest request) {
        sweepExpired();
        InternshipApplication application = ownedApplication(companyId, applicationId);
        if (application.getStatus() != ApplicationStatus.SHORTLISTED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only shortlisted applicants can receive an offer");
        }
        validate(request);
        if (interviewRepository.existsByApplicationIdAndStatusIn(applicationId, ACTIVE_INTERVIEW)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This applicant has an active interview. Complete or cancel it before making an offer");
        }

        Internship internship = internshipRepository.findById(application.getInternshipId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        long taken = offerRepository.countByInternshipIdAndStatusIn(internship.getId(), TAKES_A_SLOT);
        if (taken >= internship.getOpenings()) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "All openings already have an offer. Withdraw a pending offer to free one");
        }

        Offer offer = new Offer();
        offer.setApplicationId(applicationId);
        offer.setInternshipId(internship.getId());
        offer.setStudentId(application.getStudentId());
        offer.setStipendPerMonth(request.stipendPerMonth());
        offer.setStartDate(request.startDate());
        offer.setExpiresOn(request.expiresOn());
        offer.setMessage(clean(request.message()));
        offer.setStatus(Offer.Status.OFFERED);
        offerRepository.save(offer);

        application.setStatus(ApplicationStatus.OFFERED);
        applicationRepository.save(application);
        return toCompanyResponses(List.of(offer)).get(0);
    }

    @Transactional
    public List<CompanyOfferResponse> listForInternship(Long companyId, Long internshipId) {
        sweepExpired();
        internshipRepository.findByIdAndCompanyId(internshipId, companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        return toCompanyResponses(offerRepository.findByInternshipIdOrderByCreatedAtDesc(internshipId));
    }

    @Transactional
    public CompanyOfferResponse withdraw(Long companyId, Long offerId) {
        sweepExpired();
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offer not found"));
        // Someone else's offer looks exactly like a missing one
        internshipRepository.findByIdAndCompanyId(offer.getInternshipId(), companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offer not found"));

        if (offer.getStatus() != Offer.Status.OFFERED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending offers can be withdrawn");
        }
        offer.setStatus(Offer.Status.WITHDRAWN);
        offerRepository.save(offer);
        setApplicationStatus(offer.getApplicationId(), ApplicationStatus.OFFERED, ApplicationStatus.SHORTLISTED);
        return toCompanyResponses(List.of(offer)).get(0);
    }

    // ---------------------------------------------------------------- student side

    @Transactional
    public List<StudentOfferResponse> listOwn(Long studentId) {
        sweepExpired();
        List<Offer> offers = offerRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        if (offers.isEmpty()) {
            return List.of();
        }

        Map<Long, Internship> internships = internshipRepository
                .findAllById(offers.stream().map(Offer::getInternshipId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(Internship::getId, Function.identity()));

        Map<Long, String> companyNames = new HashMap<>();
        Set<Long> companyIds = internships.values().stream().map(Internship::getCompanyId)
                .collect(Collectors.toSet());
        if (!companyIds.isEmpty()) {
            for (CompanyProfile profile : companyProfileRepository.findByUserIdIn(companyIds)) {
                companyNames.put(profile.getUser().getId(), profile.getCompanyName());
            }
        }

        return offers.stream().map(o -> {
            Internship internship = internships.get(o.getInternshipId());
            return new StudentOfferResponse(o.getId(), o.getApplicationId(),
                    internship == null ? null : internship.getTitle(),
                    internship == null ? null : companyNames.get(internship.getCompanyId()),
                    internship == null ? 0 : internship.getDurationWeeks(),
                    o.getStipendPerMonth(), o.getStartDate(), o.getExpiresOn(), o.getMessage(),
                    o.getStatus(), o.getRespondedAt());
        }).toList();
    }

    @Transactional
    public void accept(Long studentId, Long offerId) {
        sweepExpired();
        Offer offer = ownOffer(studentId, offerId);
        requirePending(offer);

        Internship internship = internshipRepository.findById(offer.getInternshipId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        long accepted = offerRepository.countByInternshipIdAndStatusIn(internship.getId(),
                List.of(Offer.Status.ACCEPTED));
        if (accepted >= internship.getOpenings()) {
            throw new ApiException(HttpStatus.CONFLICT, "All openings for this internship are filled");
        }

        offer.setStatus(Offer.Status.ACCEPTED);
        offer.setRespondedAt(Instant.now());
        offerRepository.save(offer);
        setApplicationStatus(offer.getApplicationId(), ApplicationStatus.OFFERED, ApplicationStatus.SELECTED);

        // The last opening is filled: stop taking new applications
        if (accepted + 1 >= internship.getOpenings() && internship.getStatus() != InternshipStatus.CLOSED) {
            internship.setStatus(InternshipStatus.CLOSED);
            internshipRepository.save(internship);
        }
    }

    @Transactional
    public void decline(Long studentId, Long offerId) {
        sweepExpired();
        Offer offer = ownOffer(studentId, offerId);
        requirePending(offer);

        offer.setStatus(Offer.Status.DECLINED);
        offer.setRespondedAt(Instant.now());
        offerRepository.save(offer);
        setApplicationStatus(offer.getApplicationId(), ApplicationStatus.OFFERED, ApplicationStatus.WITHDRAWN);
    }

    // ---------------------------------------------------------------- expiry

    // Offers whose expiry date has passed stop being valid, and the applicant goes back to the shortlist
    @Transactional
    public void sweepExpired() {
        List<Offer> due = offerRepository.findByStatusAndExpiresOnBefore(Offer.Status.OFFERED, today());
        for (Offer offer : due) {
            offer.setStatus(Offer.Status.EXPIRED);
            setApplicationStatus(offer.getApplicationId(), ApplicationStatus.OFFERED, ApplicationStatus.SHORTLISTED);
        }
        offerRepository.saveAll(due);
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    @Transactional
    public void scheduledSweep() {
        sweepExpired();
    }

    // ---------------------------------------------------------------- helpers

    private InternshipApplication ownedApplication(Long companyId, Long applicationId) {
        InternshipApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        internshipRepository.findByIdAndCompanyId(application.getInternshipId(), companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        return application;
    }

    private Offer ownOffer(Long studentId, Long offerId) {
        return offerRepository.findByIdAndStudentId(offerId, studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offer not found"));
    }

    private void requirePending(Offer offer) {
        if (offer.getStatus() == Offer.Status.EXPIRED) {
            throw new ApiException(HttpStatus.CONFLICT, "This offer has expired");
        }
        if (offer.getStatus() != Offer.Status.OFFERED) {
            throw new ApiException(HttpStatus.CONFLICT, "This offer is no longer available");
        }
    }

    private void setApplicationStatus(Long applicationId, ApplicationStatus from, ApplicationStatus to) {
        applicationRepository.findById(applicationId).ifPresent(application -> {
            if (application.getStatus() == from) {
                application.setStatus(to);
                applicationRepository.save(application);
            }
        });
    }

    private void validate(OfferRequest r) {
        LocalDate today = today();
        if (r.expiresOn().isBefore(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The expiry date cannot be in the past");
        }
        if (!r.startDate().isAfter(r.expiresOn())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The start date must be after the expiry date");
        }
        if (r.startDate().isAfter(today.plusDays(365))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The start date is too far in the future");
        }
    }

    private LocalDate today() {
        return LocalDate.now(ZONE);
    }

    private List<CompanyOfferResponse> toCompanyResponses(List<Offer> offers) {
        Map<Long, User> users = userRepository
                .findAllById(offers.stream().map(Offer::getStudentId).collect(Collectors.toSet())).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return offers.stream().map(o -> {
            User student = users.get(o.getStudentId());
            return new CompanyOfferResponse(o.getId(), o.getApplicationId(),
                    student == null ? null : student.getFullName(),
                    student == null ? null : student.getEmail(),
                    o.getStipendPerMonth(), o.getStartDate(), o.getExpiresOn(), o.getMessage(),
                    o.getStatus(), o.getRespondedAt(), o.getCreatedAt());
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