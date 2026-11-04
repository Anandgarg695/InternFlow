package com.internflow.completion;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.completion.CompletionDtos.CompanyProgressResponse;

@RestController
@RequestMapping("/api/company/placements/{placementId}")
public class CompanyCompletionController {

    private final CompletionService service;

    public CompanyCompletionController(CompletionService service) {
        this.service = service;
    }

    @GetMapping("/progress")
    public CompanyProgressResponse progress(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("placementId") Long placementId) {
        return service.progress(companyId(jwt), placementId);
    }

    @PostMapping("/complete")
    public CompanyProgressResponse complete(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("placementId") Long placementId) {
        return service.complete(companyId(jwt), placementId);
    }

    private Long companyId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}