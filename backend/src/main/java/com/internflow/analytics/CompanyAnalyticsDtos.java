package com.internflow.analytics;

import java.util.List;

public final class CompanyAnalyticsDtos {

    private CompanyAnalyticsDtos() {
    }

    public record FunnelStage(
            String stage,
            long count,
            double conversionRate) {
    }

    public record InternshipStat(
            Long id,
            String title,
            String status,
            int openings,
            long applicants,
            long shortlisted,
            long interviews,
            long offers,
            long hires,
            Double avgScore) {
    }

    public record CompanyAnalyticsSummary(
            long totalInternships,
            long openInternships,
            long totalApplications,
            long totalShortlisted,
            long totalAssessed,
            Double averageTestScore,
            long totalInterviews,
            long totalOffers,
            long totalHires,
            double offerAcceptanceRate,
            long activePlacements,
            long completedPlacements,
            long totalTasks,
            long tasksReviewed,
            double taskCompletionRate,
            List<FunnelStage> funnel,
            List<InternshipStat> internships) {
    }
}
