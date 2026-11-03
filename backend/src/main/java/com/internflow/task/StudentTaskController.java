package com.internflow.task;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.task.TaskDtos.SubmissionRequest;
import com.internflow.task.TaskDtos.TaskResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/student")
public class StudentTaskController {

    private final TaskService service;

    public StudentTaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping("/placements/{placementId}/tasks")
    public List<TaskResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable("placementId") Long placementId) {
        return service.listForStudent(studentId(jwt), placementId);
    }

    @PostMapping("/tasks/{id}/submission")
    public TaskResponse submit(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @Valid @RequestBody SubmissionRequest request) {
        return service.submit(studentId(jwt), id, request);
    }

    private Long studentId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}