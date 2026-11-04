package com.internflow.completion;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.completion.CompletionDtos.StudentCompletionResponse;

@RestController
@RequestMapping("/api/student/placements/{placementId}/completion")
public class StudentCompletionController {

    private final CompletionService service;

    public StudentCompletionController(CompletionService service) {
        this.service = service;
    }

    @GetMapping
    public StudentCompletionResponse get(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("placementId") Long placementId) {
        return service.studentCompletion(Long.valueOf(jwt.getSubject()), placementId);
    }
}