package com.internflow.internship;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.common.ApiException;
import com.internflow.common.PageResponse;
import com.internflow.internship.InternshipDtos.InternshipRequest;
import com.internflow.internship.InternshipDtos.InternshipResponse;
import com.internflow.profile.CompanyProfile;
import com.internflow.profile.CompanyProfileRepository;

@Service
public class InternshipService {

    // Deadlines are calendar dates in Indian time, even though the server runs in UTC
    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private final InternshipRepository internshipRepository;
    private final CompanyProfileRepository companyProfileRepository;

    public InternshipService(InternshipRepository internshipRepository,
            CompanyProfileRepository companyProfileRepository) {
        this.internshipRepository = internshipRepository;
        this.companyProfileRepository = companyProfileRepository;
    }

    // ---------------------------------------------------------------- company side

    @Transactional
    public InternshipResponse create(Long companyId, InternshipRequest request) {
        validate(request);
        Internship internship = new Internship();
        internship.setCompanyId(companyId);
        internship.setStatus(InternshipStatus.DRAFT);
        apply(internship, request);
        internshipRepository.save(internship);
        return toResponse(internship, companyName(companyId));
    }

    @Transactional(readOnly = true)
    public List<InternshipResponse> listOwn(Long companyId) {
        String name = companyName(companyId);
        return internshipRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .map(i -> toResponse(i, name))
                .toList();
    }

    @Transactional(readOnly = true)
    public InternshipResponse getOwn(Long companyId, Long id) {
        return toResponse(findOwn(companyId, id), companyName(companyId));
    }

    @Transactional
    public InternshipResponse update(Long companyId, Long id, InternshipRequest request) {
        validate(request);
        Internship internship = findOwn(companyId, id);
        apply(internship, request);
        internshipRepository.save(internship);
        return toResponse(internship, companyName(companyId));
    }

    @Transactional
    public InternshipResponse changeStatus(Long companyId, Long id, InternshipStatus target) {
        Internship internship = findOwn(companyId, id);
        InternshipStatus current = internship.getStatus();

        boolean allowed = (current == InternshipStatus.DRAFT && target == InternshipStatus.OPEN)
                || (current == InternshipStatus.OPEN && target == InternshipStatus.CLOSED)
                || (current == InternshipStatus.CLOSED && target == InternshipStatus.OPEN);
        if (!allowed) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot change the status from " + current + " to " + target);
        }

        String name = companyName(companyId);
        if (target == InternshipStatus.OPEN) {
            if (name == null || name.isBlank()) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Add your company name in your company profile before publishing");
            }
            if (internship.getApplicationDeadline().isBefore(today())) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "The application deadline has passed. Edit the internship and choose a new deadline first");
            }
        }

        internship.setStatus(target);
        internshipRepository.save(internship);
        return toResponse(internship, name);
    }

    @Transactional
    public void deleteOwn(Long companyId, Long id) {
        Internship internship = findOwn(companyId, id);
        if (internship.getStatus() != InternshipStatus.DRAFT) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Only drafts can be deleted. Close the internship instead");
        }
        internshipRepository.delete(internship);
    }

    // ---------------------------------------------------------------- student side

    @Transactional(readOnly = true)
    public PageResponse<InternshipResponse> browse(String q, String workModeText, int page, int size) {
        WorkMode mode = parseMode(workModeText);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);

        Specification<Internship> spec = isOpen(today());
        if (q != null && !q.isBlank()) {
            spec = spec.and(matches(q.trim()));
        }
        if (mode != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("workMode"), mode));
        }

        Page<Internship> result = internshipRepository.findAll(spec,
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));

        Set<Long> companyIds = result.getContent().stream()
                .map(Internship::getCompanyId)
                .collect(Collectors.toSet());
        Map<Long, String> names = companyNames(companyIds);

        return PageResponse.of(result.map(i -> toResponse(i, names.get(i.getCompanyId()))));
    }

    @Transactional(readOnly = true)
    public InternshipResponse getOpen(Long id) {
        Internship internship = internshipRepository.findById(id)
                .filter(i -> i.getStatus() == InternshipStatus.OPEN)
                .filter(i -> !i.getApplicationDeadline().isBefore(today()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        return toResponse(internship, companyName(internship.getCompanyId()));
    }

    @Transactional(readOnly = true)
    public Internship requireAcceptingApplications(Long id) {
        Internship internship = internshipRepository.findById(id)
                .filter(i -> i.getStatus() == InternshipStatus.OPEN)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        if (internship.getApplicationDeadline().isBefore(today())) {
            throw new ApiException(HttpStatus.CONFLICT, "The application deadline has passed");
        }
        return internship;
    }

    // ---------------------------------------------------------------- helpers

    private Internship findOwn(Long companyId, Long id) {
        // Someone else's posting looks exactly like a missing one
        return internshipRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
    }

    private void validate(InternshipRequest r) {
        if (r.applicationDeadline().isBefore(today())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The application deadline cannot be in the past");
        }
        boolean needsLocation = r.workMode() != WorkMode.REMOTE;
        if (needsLocation && (r.location() == null || r.location().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Location is required for on-site and hybrid internships");
        }
    }

    private void apply(Internship i, InternshipRequest r) {
        i.setTitle(r.title().trim());
        i.setDescription(r.description().trim());
        i.setSkillsRequired(r.skillsRequired().trim());
        i.setLocation(r.location() == null || r.location().isBlank() ? null : r.location().trim());
        i.setWorkMode(r.workMode());
        i.setDurationWeeks(r.durationWeeks());
        i.setStipendPerMonth(r.stipendPerMonth());
        i.setOpenings(r.openings());
        i.setApplicationDeadline(r.applicationDeadline());
    }

    private WorkMode parseMode(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            return WorkMode.valueOf(text.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown work mode");
        }
    }

    private Specification<Internship> isOpen(LocalDate today) {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), InternshipStatus.OPEN),
                cb.greaterThanOrEqualTo(root.<LocalDate>get("applicationDeadline"), today));
    }

    private Specification<Internship> matches(String text) {
        String escaped = text.toLowerCase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        String pattern = "%" + escaped + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.<String>get("title")), pattern, '\\'),
                cb.like(cb.lower(root.<String>get("skillsRequired")), pattern, '\\'),
                cb.like(cb.lower(root.<String>get("location")), pattern, '\\'));
    }

    private LocalDate today() {
        return LocalDate.now(ZONE);
    }

    private String companyName(Long companyId) {
        return companyProfileRepository.findByUserId(companyId)
                .map(CompanyProfile::getCompanyName)
                .orElse(null);
    }

    private Map<Long, String> companyNames(Set<Long> companyIds) {
        Map<Long, String> names = new HashMap<>();
        if (companyIds.isEmpty()) {
            return names;
        }
        for (CompanyProfile profile : companyProfileRepository.findByUserIdIn(companyIds)) {
            names.put(profile.getUser().getId(), profile.getCompanyName());
        }
        return names;
    }

    private InternshipResponse toResponse(Internship i, String companyName) {
        boolean accepting = i.getStatus() == InternshipStatus.OPEN
                && !i.getApplicationDeadline().isBefore(today());
        return new InternshipResponse(i.getId(), i.getTitle(), i.getDescription(), i.getSkillsRequired(),
                i.getLocation(), i.getWorkMode(), i.getDurationWeeks(), i.getStipendPerMonth(),
                i.getOpenings(), i.getApplicationDeadline(), i.getStatus(), accepting,
                companyName, i.getCreatedAt());
    }
}