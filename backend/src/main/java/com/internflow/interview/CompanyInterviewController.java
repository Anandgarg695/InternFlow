package com.internflow.interview;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.interview.InterviewDtos.CompanyInterviewResponse;
import com.internflow.interview.InterviewDtos.CompleteRequest;
import com.internflow.interview.InterviewDtos.InterviewRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/company")
public class CompanyInterviewController {

    private final InterviewService service;

    public CompanyInterviewController(InterviewService service) {
        this.service = service;
    }

    @GetMapping("/internships/{internshipId}/interviews")
    public List<CompanyInterviewResponse> list(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("internshipId") Long internshipId) {
        return service.listForInternship(companyId(jwt), internshipId);
    }

    @PostMapping("/applications/{applicationId}/interviews")
    public ResponseEntity<CompanyInterviewResponse> schedule(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("applicationId") Long applicationId, @Valid @RequestBody InterviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.schedule(companyId(jwt), applicationId, request));
    }

    @PutMapping("/interviews/{id}")
    public CompanyInterviewResponse reschedule(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @Valid @RequestBody InterviewRequest request) {
        return service.reschedule(companyId(jwt), id, request);
    }

    @PatchMapping("/interviews/{id}/cancel")
    public CompanyInterviewResponse cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        return service.cancel(companyId(jwt), id);
    }

    @PatchMapping("/interviews/{id}/complete")
    public CompanyInterviewResponse complete(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @Valid @RequestBody CompleteRequest request) {
        return service.complete(companyId(jwt), id, request);
    }

    private Long companyId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}