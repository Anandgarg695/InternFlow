package com.internflow.placement;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class PlacementDtos {

    private PlacementDtos() {
    }

    public record InviteRequest(@NotBlank @Email @Size(max = 255) String email) {
    }

    // mentorId = null removes the current mentor
    public record AssignMentorRequest(Long mentorId) {
    }

    public record CompanyMentorResponse(Long linkId, Long mentorId, String name, String email,
            MentorLink.Status status) {
    }

    public record MentorInvitationResponse(Long linkId, String companyName, Instant invitedAt) {
    }

    public record CompanyPlacementResponse(Long id, Long applicationId, String studentName, String studentEmail,
            LocalDate startDate, LocalDate endDate, String phase, Long mentorId, String mentorName) {
    }

    public record StudentPlacementResponse(Long id, String internshipTitle, String companyName,
            LocalDate startDate, LocalDate endDate, String phase, String mentorName, String mentorEmail) {
    }

    // A mentor sees only these fields about an intern, nothing from the student's profile or applications
    public record MentorInternResponse(Long id, String studentName, String studentEmail, String internshipTitle,
            String companyName, LocalDate startDate, LocalDate endDate, String phase) {
    }
}