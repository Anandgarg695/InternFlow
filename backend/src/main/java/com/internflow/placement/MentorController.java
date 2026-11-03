package com.internflow.placement;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.placement.PlacementDtos.MentorInternResponse;
import com.internflow.placement.PlacementDtos.MentorInvitationResponse;

@RestController
@RequestMapping("/api/mentor")
public class MentorController {

    private final PlacementService placementService;
    private final MentorLinkService mentorLinkService;

    public MentorController(PlacementService placementService, MentorLinkService mentorLinkService) {
        this.placementService = placementService;
        this.mentorLinkService = mentorLinkService;
    }

    @GetMapping("/invitations")
    public List<MentorInvitationResponse> invitations(@AuthenticationPrincipal Jwt jwt) {
        return mentorLinkService.listInvitations(mentorId(jwt));
    }

    @PatchMapping("/invitations/{id}/accept")
    public ResponseEntity<Void> accept(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        mentorLinkService.respond(mentorId(jwt), id, true);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/invitations/{id}/decline")
    public ResponseEntity<Void> decline(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        mentorLinkService.respond(mentorId(jwt), id, false);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/interns")
    public List<MentorInternResponse> interns(@AuthenticationPrincipal Jwt jwt) {
        return placementService.listForMentor(mentorId(jwt));
    }

    private Long mentorId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}