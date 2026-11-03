package com.internflow.placement;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.common.ApiException;
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.placement.PlacementDtos.CompanyPlacementResponse;
import com.internflow.placement.PlacementDtos.MentorInternResponse;
import com.internflow.placement.PlacementDtos.StudentPlacementResponse;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class PlacementService {

    // Dates are calendar dates in Indian time, even though the server runs in UTC
    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private final PlacementRepository placementRepository;
    private final MentorLinkRepository mentorLinkRepository;
    private final InternshipRepository internshipRepository;
    private final UserRepository userRepository;
    private final CompanyNames companyNames;

    public PlacementService(PlacementRepository placementRepository,
            MentorLinkRepository mentorLinkRepository,
            InternshipRepository internshipRepository,
            UserRepository userRepository,
            CompanyNames companyNames) {
        this.placementRepository = placementRepository;
        this.mentorLinkRepository = mentorLinkRepository;
        this.internshipRepository = internshipRepository;
        this.userRepository = userRepository;
        this.companyNames = companyNames;
    }

    // Called when a student accepts an offer
    @Transactional
    public void createFor(Long applicationId, Internship internship, Long studentId, LocalDate startDate) {
        if (placementRepository.existsByApplicationId(applicationId)) {
            return;
        }
        Placement placement = new Placement();
        placement.setApplicationId(applicationId);
        placement.setInternshipId(internship.getId());
        placement.setStudentId(studentId);
        placement.setStartDate(startDate);
        placement.setEndDate(startDate.plusWeeks(internship.getDurationWeeks()));
        placement.setStatus(Placement.Status.ACTIVE);
        placementRepository.save(placement);
    }

    // ---------------------------------------------------------------- company side

    @Transactional(readOnly = true)
    public List<CompanyPlacementResponse> listForInternship(Long companyId, Long internshipId) {
        // Someone else's internship looks exactly like a missing one
        internshipRepository.findByIdAndCompanyId(internshipId, companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        List<Placement> placements = placementRepository.findByInternshipIdOrderByStartDateAsc(internshipId);

        Set<Long> ids = new HashSet<>();
        for (Placement p : placements) {
            ids.add(p.getStudentId());
            if (p.getMentorId() != null) {
                ids.add(p.getMentorId());
            }
        }
        Map<Long, User> users = usersById(ids);

        return placements.stream().map(p -> {
            User student = users.get(p.getStudentId());
            User mentor = p.getMentorId() == null ? null : users.get(p.getMentorId());
            return toCompanyResponse(p, student, mentor);
        }).toList();
    }

    @Transactional
    public CompanyPlacementResponse assignMentor(Long companyId, Long placementId, Long mentorId) {
        Placement placement = placementRepository.findById(placementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Intern not found"));
        internshipRepository.findByIdAndCompanyId(placement.getInternshipId(), companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Intern not found"));
        if (placement.getStatus() != Placement.Status.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "This placement is no longer active");
        }

        if (mentorId != null) {
            boolean onTeam = mentorLinkRepository.findByCompanyIdAndMentorId(companyId, mentorId)
                    .filter(link -> link.getStatus() == MentorLink.Status.ACTIVE)
                    .isPresent();
            if (!onTeam) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a mentor from your accepted mentor team");
            }
        }
        placement.setMentorId(mentorId);
        placementRepository.save(placement);

        Map<Long, User> users = usersById(
                mentorId == null ? Set.of(placement.getStudentId()) : Set.of(placement.getStudentId(), mentorId));
        return toCompanyResponse(placement, users.get(placement.getStudentId()),
                mentorId == null ? null : users.get(mentorId));
    }

    // ---------------------------------------------------------------- student side

    @Transactional(readOnly = true)
    public List<StudentPlacementResponse> listOwn(Long studentId) {
        List<Placement> placements = placementRepository.findByStudentIdOrderByStartDateDesc(studentId);
        if (placements.isEmpty()) {
            return List.of();
        }
        Map<Long, Internship> internships = internshipsById(placements);
        Map<Long, String> companies = companyNames.forCompanies(
                internships.values().stream().map(Internship::getCompanyId).collect(Collectors.toSet()));
        Map<Long, User> mentors = usersById(placements.stream().map(Placement::getMentorId)
                .filter(Objects::nonNull).collect(Collectors.toSet()));

        return placements.stream().map(p -> {
            Internship internship = internships.get(p.getInternshipId());
            User mentor = p.getMentorId() == null ? null : mentors.get(p.getMentorId());
            return new StudentPlacementResponse(p.getId(),
                    internship == null ? null : internship.getTitle(),
                    internship == null ? null : companies.get(internship.getCompanyId()),
                    p.getStartDate(), p.getEndDate(), phase(p),
                    mentor == null ? null : mentor.getFullName(),
                    mentor == null ? null : mentor.getEmail());
        }).toList();
    }

    // ---------------------------------------------------------------- mentor side

    @Transactional(readOnly = true)
    public List<MentorInternResponse> listForMentor(Long mentorId) {
        List<Placement> placements = placementRepository.findByMentorIdOrderByStartDateAsc(mentorId);
        if (placements.isEmpty()) {
            return List.of();
        }
        Map<Long, Internship> internships = internshipsById(placements);
        Map<Long, String> companies = companyNames.forCompanies(
                internships.values().stream().map(Internship::getCompanyId).collect(Collectors.toSet()));
        Map<Long, User> students = usersById(
                placements.stream().map(Placement::getStudentId).collect(Collectors.toSet()));

        return placements.stream().map(p -> {
            Internship internship = internships.get(p.getInternshipId());
            User student = students.get(p.getStudentId());
            return new MentorInternResponse(p.getId(),
                    student == null ? null : student.getFullName(),
                    student == null ? null : student.getEmail(),
                    internship == null ? null : internship.getTitle(),
                    internship == null ? null : companies.get(internship.getCompanyId()),
                    p.getStartDate(), p.getEndDate(), phase(p));
        }).toList();
    }

    // ---------------------------------------------------------------- helpers

    private CompanyPlacementResponse toCompanyResponse(Placement p, User student, User mentor) {
        return new CompanyPlacementResponse(p.getId(), p.getApplicationId(),
                student == null ? null : student.getFullName(),
                student == null ? null : student.getEmail(),
                p.getStartDate(), p.getEndDate(), phase(p), p.getMentorId(),
                mentor == null ? null : mentor.getFullName());
    }

    private String phase(Placement p) {
        if (p.getStatus() == Placement.Status.COMPLETED) {
            return "COMPLETED";
        }
        if (p.getStatus() == Placement.Status.TERMINATED) {
            return "TERMINATED";
        }
        LocalDate today = LocalDate.now(ZONE);
        if (today.isBefore(p.getStartDate())) {
            return "UPCOMING";
        }
        if (today.isAfter(p.getEndDate())) {
            return "ENDED";
        }
        return "ONGOING";
    }

    private Map<Long, Internship> internshipsById(List<Placement> placements) {
        return internshipRepository
                .findAllById(placements.stream().map(Placement::getInternshipId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Internship::getId, Function.identity()));
    }

    private Map<Long, User> usersById(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return new HashMap<>();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }
}