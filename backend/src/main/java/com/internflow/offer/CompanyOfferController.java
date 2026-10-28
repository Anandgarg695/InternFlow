package com.internflow.offer;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.offer.OfferDtos.CompanyOfferResponse;
import com.internflow.offer.OfferDtos.OfferRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/company")
public class CompanyOfferController {

    private final OfferService service;

    public CompanyOfferController(OfferService service) {
        this.service = service;
    }

    @GetMapping("/internships/{internshipId}/offers")
    public List<CompanyOfferResponse> list(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("internshipId") Long internshipId) {
        return service.listForInternship(companyId(jwt), internshipId);
    }

    @PostMapping("/applications/{applicationId}/offers")
    public ResponseEntity<CompanyOfferResponse> make(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("applicationId") Long applicationId, @Valid @RequestBody OfferRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.make(companyId(jwt), applicationId, request));
    }

    @PatchMapping("/offers/{id}/withdraw")
    public CompanyOfferResponse withdraw(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        return service.withdraw(companyId(jwt), id);
    }

    private Long companyId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}