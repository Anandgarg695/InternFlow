package com.internflow.application;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.application.ApplicationDtos.ApplicantResponse;
import com.internflow.application.ApplicationDtos.DecisionRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/company")
public class CompanyApplicationController {

    private final ApplicationService service;

    public CompanyApplicationController(ApplicationService service) {
        this.service = service;
    }

    @GetMapping("/internships/{id}/applications")
    public List<ApplicantResponse> applicants(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        return service.listApplicants(companyId(jwt), id);
    }

    @PatchMapping("/applications/{id}/status")
    public ApplicantResponse decide(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @Valid @RequestBody DecisionRequest request) {
        return service.decide(companyId(jwt), id, request.status());
    }

    private Long companyId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}