package com.internflow.screening;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.screening.ScreeningDtos.StartResponse;
import com.internflow.screening.ScreeningDtos.SubmitRequest;
import com.internflow.screening.ScreeningDtos.SubmitResponse;
import com.internflow.screening.ScreeningDtos.TestInfoResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/student/applications/{applicationId}/test")
public class StudentTestController {

    private final ScreeningTestService service;

    public StudentTestController(ScreeningTestService service) {
        this.service = service;
    }

    @GetMapping
    public TestInfoResponse info(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("applicationId") Long applicationId) {
        return service.info(studentId(jwt), applicationId);
    }

    @PostMapping("/start")
    public StartResponse start(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("applicationId") Long applicationId) {
        return service.start(studentId(jwt), applicationId);
    }

    @PostMapping("/submit")
    public SubmitResponse submit(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("applicationId") Long applicationId,
            @Valid @RequestBody SubmitRequest request) {
        return service.submit(studentId(jwt), applicationId, request);
    }

    private Long studentId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}