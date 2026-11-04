package com.internflow.completion;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.completion.CompletionDtos.EvaluationRequest;
import com.internflow.completion.CompletionDtos.EvaluationResponse;
import com.internflow.completion.CompletionDtos.MentorEvaluationView;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/mentor/interns/{placementId}/evaluation")
public class MentorEvaluationController {

    private final CompletionService service;

    public MentorEvaluationController(CompletionService service) {
        this.service = service;
    }

    @GetMapping
    public MentorEvaluationView view(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("placementId") Long placementId) {
        return service.mentorView(mentorId(jwt), placementId);
    }

    @PutMapping
    public EvaluationResponse save(@AuthenticationPrincipal Jwt jwt, @PathVariable("placementId") Long placementId,
            @Valid @RequestBody EvaluationRequest request) {
        return service.saveEvaluation(mentorId(jwt), placementId, request);
    }

    private Long mentorId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}