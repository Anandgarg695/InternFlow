package com.internflow.profile;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.profile.CompanyProfileDtos.CompanyProfileRequest;
import com.internflow.profile.CompanyProfileDtos.CompanyProfileResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/company/profile")
public class CompanyProfileController {

    private final CompanyProfileService service;

    public CompanyProfileController(CompanyProfileService service) {
        this.service = service;
    }

    @GetMapping
    public CompanyProfileResponse get(@AuthenticationPrincipal Jwt jwt) {
        return service.get(Long.valueOf(jwt.getSubject()));
    }

    @PutMapping
    public CompanyProfileResponse save(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CompanyProfileRequest request) {
        return service.save(Long.valueOf(jwt.getSubject()), request);
    }
}