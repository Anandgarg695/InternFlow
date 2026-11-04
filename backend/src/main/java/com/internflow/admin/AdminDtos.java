package com.internflow.admin;

import java.time.Instant;
import java.util.Map;

import jakarta.validation.constraints.NotNull;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record AdminOverview(Map<String, Long> usersByRole, long disabledUsers, long pendingCompanies,
            long internships, long openInternships, long applications, long selected, long placements,
            long completedPlacements, long certificates) {
    }

    public record AdminUserResponse(Long id, String fullName, String email, String role, boolean enabled,
            boolean approved, Instant createdAt) {
    }

    public record EnabledRequest(@NotNull Boolean enabled) {
    }

    public record ApprovalRequest(@NotNull Boolean approved) {
    }
}