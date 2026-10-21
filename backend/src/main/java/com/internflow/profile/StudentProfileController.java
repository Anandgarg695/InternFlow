package com.internflow.profile;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.profile.StudentProfileDtos.StudentProfileRequest;
import com.internflow.profile.StudentProfileDtos.StudentProfileResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/student/profile")
public class StudentProfileController {

    private final StudentProfileService service;

    public StudentProfileController(StudentProfileService service) {
        this.service = service;
    }

    @GetMapping
    public StudentProfileResponse get(@AuthenticationPrincipal Jwt jwt) {
        return service.get(Long.valueOf(jwt.getSubject()));
    }

    @PutMapping
    public StudentProfileResponse save(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody StudentProfileRequest request) {
        return service.save(Long.valueOf(jwt.getSubject()), request);
    }
}