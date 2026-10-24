package com.internflow.interview;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.interview.InterviewDtos.RescheduleRequest;
import com.internflow.interview.InterviewDtos.StudentInterviewResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/student/interviews")
public class StudentInterviewController {

    private final InterviewService service;

    public StudentInterviewController(InterviewService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentInterviewResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return service.listOwn(studentId(jwt));
    }

    @PatchMapping("/{id}/confirm")
    public ResponseEntity<Void> confirm(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        service.confirm(studentId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reschedule-request")
    public ResponseEntity<Void> requestReschedule(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @Valid @RequestBody RescheduleRequest request) {
        service.requestReschedule(studentId(jwt), id, request.reason());
        return ResponseEntity.noContent().build();
    }

    private Long studentId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}