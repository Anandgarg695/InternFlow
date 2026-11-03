package com.internflow.placement;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.placement.PlacementDtos.StudentPlacementResponse;

@RestController
@RequestMapping("/api/student/placements")
public class StudentPlacementController {

    private final PlacementService service;

    public StudentPlacementController(PlacementService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentPlacementResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return service.listOwn(Long.valueOf(jwt.getSubject()));
    }
}