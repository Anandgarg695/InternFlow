package com.internflow.internship;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.internship.InternshipDtos.InternshipRequest;
import com.internflow.internship.InternshipDtos.InternshipResponse;
import com.internflow.internship.InternshipDtos.StatusRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/company/internships")
public class CompanyInternshipController {

    private final InternshipService service;

    public CompanyInternshipController(InternshipService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<InternshipResponse> create(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody InternshipRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(companyId(jwt), request));
    }

    @GetMapping
    public List<InternshipResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return service.listOwn(companyId(jwt));
    }

    @GetMapping("/{id}")
    public InternshipResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        return service.getOwn(companyId(jwt), id);
    }

    @PutMapping("/{id}")
    public InternshipResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @Valid @RequestBody InternshipRequest request) {
        return service.update(companyId(jwt), id, request);
    }

    @PatchMapping("/{id}/status")
    public InternshipResponse changeStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @Valid @RequestBody StatusRequest request) {
        return service.changeStatus(companyId(jwt), id, request.status());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        service.deleteOwn(companyId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    private Long companyId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}