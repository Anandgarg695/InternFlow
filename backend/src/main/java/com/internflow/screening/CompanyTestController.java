package com.internflow.screening;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.screening.ScreeningDtos.TestRequest;
import com.internflow.screening.ScreeningDtos.TestResponse;
import com.internflow.screening.ScreeningDtos.TestResultsResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/company/internships/{internshipId}/test")
public class CompanyTestController {

    private final ScreeningTestService service;

    public CompanyTestController(ScreeningTestService service) {
        this.service = service;
    }

    @GetMapping
    public TestResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable("internshipId") Long internshipId) {
        return service.getForCompany(companyId(jwt), internshipId);
    }

    @PutMapping
    public TestResponse save(@AuthenticationPrincipal Jwt jwt, @PathVariable("internshipId") Long internshipId,
            @Valid @RequestBody TestRequest request) {
        return service.save(companyId(jwt), internshipId, request);
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("internshipId") Long internshipId) {
        service.delete(companyId(jwt), internshipId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/results")
    public TestResultsResponse results(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("internshipId") Long internshipId) {
        return service.results(companyId(jwt), internshipId);
    }

    private Long companyId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}