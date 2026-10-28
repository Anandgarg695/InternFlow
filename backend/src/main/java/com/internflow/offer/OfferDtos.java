package com.internflow.offer;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class OfferDtos {

    private OfferDtos() {
    }

    public record OfferRequest(
            @NotNull @Min(0) @Max(1000000) Integer stipendPerMonth,
            @NotNull LocalDate startDate,
            @NotNull LocalDate expiresOn,
            @Size(max = 1000) String message) {
    }

    public record CompanyOfferResponse(
            Long id,
            Long applicationId,
            String studentName,
            String studentEmail,
            int stipendPerMonth,
            LocalDate startDate,
            LocalDate expiresOn,
            String message,
            Offer.Status status,
            Instant respondedAt,
            Instant createdAt) {
    }

    public record StudentOfferResponse(
            Long id,
            Long applicationId,
            String internshipTitle,
            String companyName,
            int durationWeeks,
            int stipendPerMonth,
            LocalDate startDate,
            LocalDate expiresOn,
            String message,
            Offer.Status status,
            Instant respondedAt) {
    }
}