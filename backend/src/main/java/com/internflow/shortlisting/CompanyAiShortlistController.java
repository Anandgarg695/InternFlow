package com.internflow.shortlisting;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.shortlisting.AiShortlistDtos.AiBatchShortlistRequest;
import com.internflow.shortlisting.AiShortlistDtos.AiBatchShortlistResponse;
import com.internflow.shortlisting.AiShortlistDtos.AiCandidateRanking;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/company/internships/{id}/ai-shortlist")
public class CompanyAiShortlistController {

    private final AiShortlistService service;

    public CompanyAiShortlistController(AiShortlistService service) {
        this.service = service;
    }

    @GetMapping("/rankings")
    public List<AiCandidateRanking> rankings(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") Long internshipId) {
        return service.rankCandidates(companyId(jwt), internshipId);
    }

    @PostMapping("/batch")
    public AiBatchShortlistResponse batchShortlist(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") Long internshipId,
            @Valid @RequestBody(required = false) AiBatchShortlistRequest request) {
        AiBatchShortlistRequest req = request != null ? request : new AiBatchShortlistRequest(70, null);
        return service.batchShortlist(companyId(jwt), internshipId, req);
    }

    private Long companyId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
