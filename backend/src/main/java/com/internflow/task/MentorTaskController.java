package com.internflow.task;

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

import com.internflow.task.TaskDtos.ReviewRequest;
import com.internflow.task.TaskDtos.TaskRequest;
import com.internflow.task.TaskDtos.TaskResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/mentor")
public class MentorTaskController {

    private final TaskService service;

    public MentorTaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping("/interns/{placementId}/tasks")
    public List<TaskResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable("placementId") Long placementId) {
        return service.listForMentor(mentorId(jwt), placementId);
    }

    @PostMapping("/interns/{placementId}/tasks")
    public ResponseEntity<TaskResponse> create(@AuthenticationPrincipal Jwt jwt,
            @PathVariable("placementId") Long placementId, @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(mentorId(jwt), placementId, request));
    }

    @PutMapping("/tasks/{id}")
    public TaskResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @Valid @RequestBody TaskRequest request) {
        return service.update(mentorId(jwt), id, request);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id) {
        service.delete(mentorId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/tasks/{id}/review")
    public TaskResponse review(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @Valid @RequestBody ReviewRequest request) {
        return service.review(mentorId(jwt), id, request);
    }

    private Long mentorId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}