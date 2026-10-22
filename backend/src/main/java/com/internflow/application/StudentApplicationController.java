package com.internflow.application;

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

import com.internflow.application.ApplicationDtos.ApplyRequest;
import com.internflow.application.ApplicationDtos.StudentApplicationResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/student/applications")
public class StudentApplicationController {

    private final ApplicationService service;

    public StudentApplicationController(ApplicationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<StudentApplicationResponse> apply(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ApplyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.apply(studentId(jwt), request));
    }

    @GetMapping
    public List<StudentApplicationResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return service.listOwn(studentId(jwt));
    }

    @PatchMapping("/{id}/withdraw")
    public StudentApplicationResponse withdraw(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        return service.withdraw(studentId(jwt), id);
    }

    private Long studentId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}