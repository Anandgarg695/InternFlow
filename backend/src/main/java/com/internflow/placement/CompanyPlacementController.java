package com.internflow.placement;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.placement.PlacementDtos.AssignMentorRequest;
import com.internflow.placement.PlacementDtos.CompanyMentorResponse;
import com.internflow.placement.PlacementDtos.CompanyPlacementResponse;
import com.internflow.placement.PlacementDtos.InviteRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/company")
public class CompanyPlacementController {

    private final PlacementService placementService;
    private final MentorLinkService mentorLinkService;

    public CompanyPlacementController(PlacementService placementService, MentorLinkService mentorLinkService) {
        this.placementService = placementService;
        this.mentorLinkService = mentorLinkService;
    }

    @GetMapping("/internships/{internshipId}/interns")
    public List<CompanyPlacementResponse> interns(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("internshipId") Long internshipId) {
        return placementService.listForInternship(companyId(jwt), internshipId);
    }

    @PatchMapping("/placements/{id}/mentor")
    public CompanyPlacementResponse assignMentor(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @RequestBody AssignMentorRequest request) {
        return placementService.assignMentor(companyId(jwt), id, request.mentorId());
    }

    @GetMapping("/mentors")
    public List<CompanyMentorResponse> mentors(@AuthenticationPrincipal Jwt jwt) {
        return mentorLinkService.listForCompany(companyId(jwt));
    }

    @PostMapping("/mentors/invite")
    public ResponseEntity<CompanyMentorResponse> invite(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody InviteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mentorLinkService.invite(companyId(jwt), request.email()));
    }

    @DeleteMapping("/mentors/{id}")
    public ResponseEntity<Void> removeMentor(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        mentorLinkService.remove(companyId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    private Long companyId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}