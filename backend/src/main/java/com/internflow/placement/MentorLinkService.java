package com.internflow.placement;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.common.ApiException;
import com.internflow.placement.PlacementDtos.CompanyMentorResponse;
import com.internflow.placement.PlacementDtos.MentorInvitationResponse;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class MentorLinkService {

    private final MentorLinkRepository linkRepository;
    private final PlacementRepository placementRepository;
    private final UserRepository userRepository;
    private final CompanyNames companyNames;

    public MentorLinkService(MentorLinkRepository linkRepository, PlacementRepository placementRepository,
            UserRepository userRepository, CompanyNames companyNames) {
        this.linkRepository = linkRepository;
        this.placementRepository = placementRepository;
        this.userRepository = userRepository;
        this.companyNames = companyNames;
    }

    // ---------------------------------------------------------------- company side

    @Transactional
    public CompanyMentorResponse invite(Long companyId, String rawEmail) {
        String email = rawEmail.trim().toLowerCase();
        User mentor = userRepository.findByEmail(email)
                .filter(u -> u.isEnabled() && "MENTOR".equals(u.getRole().getName()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No mentor account found with that email"));

        MentorLink link = linkRepository.findByCompanyIdAndMentorId(companyId, mentor.getId()).orElse(null);
        if (link == null) {
            link = new MentorLink();
            link.setCompanyId(companyId);
            link.setMentorId(mentor.getId());
        } else if (link.getStatus() == MentorLink.Status.ACTIVE || link.getStatus() == MentorLink.Status.INVITED) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This mentor is already on your team or has a pending invitation");
        }
        link.setStatus(MentorLink.Status.INVITED);
        linkRepository.save(link);
        return toResponse(link, mentor);
    }

    @Transactional(readOnly = true)
    public List<CompanyMentorResponse> listForCompany(Long companyId) {
        List<MentorLink> links = linkRepository.findByCompanyIdAndStatusInOrderByCreatedAtDesc(companyId,
                List.of(MentorLink.Status.INVITED, MentorLink.Status.ACTIVE));
        Map<Long, User> mentors = usersById(
                links.stream().map(MentorLink::getMentorId).collect(Collectors.toSet()));
        return links.stream().map(l -> toResponse(l, mentors.get(l.getMentorId()))).toList();
    }

    @Transactional
    public void remove(Long companyId, Long linkId) {
        MentorLink link = linkRepository.findByIdAndCompanyId(linkId, companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Mentor not found"));
        if (link.getStatus() != MentorLink.Status.ACTIVE && link.getStatus() != MentorLink.Status.INVITED) {
            throw new ApiException(HttpStatus.CONFLICT, "This mentor is not on your team");
        }
        if (link.getStatus() == MentorLink.Status.ACTIVE
                && placementRepository.countForMentorAndCompany(link.getMentorId(), companyId,
                        Placement.Status.ACTIVE) > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This mentor still has interns. Assign those interns to someone else first");
        }
        link.setStatus(MentorLink.Status.REMOVED);
        linkRepository.save(link);
    }

    // ---------------------------------------------------------------- mentor side

    @Transactional(readOnly = true)
    public List<MentorInvitationResponse> listInvitations(Long mentorId) {
        List<MentorLink> links = linkRepository.findByMentorIdAndStatusOrderByCreatedAtDesc(mentorId,
                MentorLink.Status.INVITED);
        Map<Long, String> companies = companyNames.forCompanies(
                links.stream().map(MentorLink::getCompanyId).collect(Collectors.toSet()));
        return links.stream()
                .map(l -> new MentorInvitationResponse(l.getId(), companies.get(l.getCompanyId()), l.getUpdatedAt()))
                .toList();
    }

    @Transactional
    public void respond(Long mentorId, Long linkId, boolean accept) {
        MentorLink link = linkRepository.findByIdAndMentorId(linkId, mentorId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitation not found"));
        if (link.getStatus() != MentorLink.Status.INVITED) {
            throw new ApiException(HttpStatus.CONFLICT, "This invitation has already been answered");
        }
        link.setStatus(accept ? MentorLink.Status.ACTIVE : MentorLink.Status.DECLINED);
        linkRepository.save(link);
    }

    // ---------------------------------------------------------------- helpers

    private CompanyMentorResponse toResponse(MentorLink link, User mentor) {
        return new CompanyMentorResponse(link.getId(), link.getMentorId(),
                mentor == null ? null : mentor.getFullName(),
                mentor == null ? null : mentor.getEmail(),
                link.getStatus());
    }

    private Map<Long, User> usersById(Set<Long> ids) {
        if (ids.isEmpty()) {
            return new HashMap<>();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }
}