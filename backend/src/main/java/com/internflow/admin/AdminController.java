package com.internflow.admin;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.admin.AdminDtos.AdminOverview;
import com.internflow.admin.AdminDtos.AdminUserResponse;
import com.internflow.admin.AdminDtos.ApprovalRequest;
import com.internflow.admin.AdminDtos.EnabledRequest;
import com.internflow.common.PageResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService service;

    public AdminController(AdminService service) {
        this.service = service;
    }

    @GetMapping("/overview")
    public AdminOverview overview() {
        return service.overview();
    }

    @GetMapping("/users")
    public PageResponse<AdminUserResponse> users(
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "pending", defaultValue = "false") boolean pending,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "15") int size) {
        return service.users(role, q, pending, page, size);
    }

    @PatchMapping("/users/{id}/enabled")
    public AdminUserResponse setEnabled(@AuthenticationPrincipal Jwt jwt, @PathVariable("id") Long id,
            @Valid @RequestBody EnabledRequest request) {
        return service.setEnabled(Long.valueOf(jwt.getSubject()), id, request.enabled());
    }

    @PatchMapping("/users/{id}/approval")
    public AdminUserResponse setApproved(@PathVariable("id") Long id,
            @Valid @RequestBody ApprovalRequest request) {
        return service.setApproved(id, request.approved());
    }
}