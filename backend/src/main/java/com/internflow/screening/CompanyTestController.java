package com.internflow.screening;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.screening.ScreeningDtos.AdvanceResponse;
import com.internflow.screening.ScreeningDtos.RoundSummary;
import com.internflow.screening.ScreeningDtos.TestRequest;
import com.internflow.screening.ScreeningDtos.TestResponse;
import com.internflow.screening.ScreeningDtos.TestResultsResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/company")
public class CompanyTestController {

    private final ScreeningTestService service;

    public CompanyTestController(ScreeningTestService service) {
        this.service = service;
    }

    @GetMapping("/internships/{internshipId}/rounds")
    public List<RoundSummary> rounds(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("internshipId") Long internshipId) {
        return service.listRounds(companyId(jwt), internshipId);
    }

    @GetMapping("/internships/{internshipId}/rounds/{round}/test")
    public TestResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable("internshipId") Long internshipId,
            @PathVariable("round") int round) {
        return service.getForCompany(companyId(jwt), internshipId, round);
    }

    @PutMapping("/internships/{internshipId}/rounds/{round}/test")
    public TestResponse save(@AuthenticationPrincipal Jwt jwt, @PathVariable("internshipId") Long internshipId,
            @PathVariable("round") int round, @Valid @RequestBody TestRequest request) {
        return service.save(companyId(jwt), internshipId, round, request);
    }

    @DeleteMapping("/internships/{internshipId}/rounds/{round}/test")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("internshipId") Long internshipId, @PathVariable("round") int round) {
        service.delete(companyId(jwt), internshipId, round);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/internships/{internshipId}/test/results")
    public TestResultsResponse results(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("internshipId") Long internshipId) {
        return service.results(companyId(jwt), internshipId);
    }

    @PostMapping("/applications/{applicationId}/advance")
    public AdvanceResponse advance(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("applicationId") Long applicationId) {
        return service.advance(companyId(jwt), applicationId);
    }

    private Long companyId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}