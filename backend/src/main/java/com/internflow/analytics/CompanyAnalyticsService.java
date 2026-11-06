package com.internflow.analytics;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.analytics.CompanyAnalyticsDtos.CompanyAnalyticsSummary;
import com.internflow.analytics.CompanyAnalyticsDtos.FunnelStage;
import com.internflow.analytics.CompanyAnalyticsDtos.InternshipStat;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

@Service
public class CompanyAnalyticsService {

    private final EntityManager em;

    public CompanyAnalyticsService(EntityManager em) {
        this.em = em;
    }

    @Transactional(readOnly = true)
    public CompanyAnalyticsSummary getAnalytics(Long companyId, Long internshipId) {
        String filter = internshipId != null ? " and i.id = :iid" : "";

        // Internship counts
        long totalInternships = queryCount("select count(*) from internships i where i.company_id = :cid" + filter, companyId, internshipId);
        long openInternships = queryCount("select count(*) from internships i where i.company_id = :cid and i.status = 'OPEN'" + filter, companyId, internshipId);

        // Funnel metrics
        long totalApplications = queryCount("select count(*) from applications a join internships i on i.id = a.internship_id where i.company_id = :cid" + filter, companyId, internshipId);
        long totalShortlisted = queryCount("select count(*) from applications a join internships i on i.id = a.internship_id where i.company_id = :cid and a.status in ('SHORTLISTED', 'OFFERED', 'SELECTED')" + filter, companyId, internshipId);
        long totalAssessed = queryCount("select count(distinct a.id) from applications a join internships i on i.id = a.internship_id join test_attempts t on t.application_id = a.id where i.company_id = :cid and t.submitted_at is not null" + filter, companyId, internshipId);
        long totalInterviews = queryCount("select count(distinct a.id) from interviews iv join applications a on a.id = iv.application_id join internships i on i.id = a.internship_id where i.company_id = :cid and iv.status = 'COMPLETED'" + filter, companyId, internshipId);
        long totalOffers = queryCount("select count(distinct o.id) from offers o join internships i on i.id = o.internship_id where i.company_id = :cid" + filter, companyId, internshipId);
        long totalHires = queryCount("select count(distinct o.id) from offers o join internships i on i.id = o.internship_id where i.company_id = :cid and o.status = 'ACCEPTED'" + filter, companyId, internshipId);

        // Average test score
        Double avgScore = queryAvg("select avg(t.score * 100.0 / nullif(t.total, 0)) from test_attempts t join applications a on a.id = t.application_id join internships i on i.id = a.internship_id where i.company_id = :cid and t.score is not null and t.total > 0" + filter, companyId, internshipId);

        // Placements & Tasks
        long activePlacements = queryCount("select count(*) from placements p join internships i on i.id = p.internship_id where i.company_id = :cid and p.status = 'ACTIVE'" + filter, companyId, internshipId);
        long completedPlacements = queryCount("select count(*) from placements p join internships i on i.id = p.internship_id where i.company_id = :cid and p.status = 'COMPLETED'" + filter, companyId, internshipId);
        long totalTasks = queryCount("select count(*) from tasks t join placements p on p.id = t.placement_id join internships i on i.id = p.internship_id where i.company_id = :cid" + filter, companyId, internshipId);
        long tasksReviewed = queryCount("select count(*) from tasks t join placements p on p.id = t.placement_id join internships i on i.id = p.internship_id where i.company_id = :cid and t.status = 'REVIEWED'" + filter, companyId, internshipId);

        double offerAcceptanceRate = totalOffers > 0 ? Math.round((totalHires * 100.0 / totalOffers) * 10.0) / 10.0 : 0.0;
        double taskCompletionRate = totalTasks > 0 ? Math.round((tasksReviewed * 100.0 / totalTasks) * 10.0) / 10.0 : 0.0;

        // Funnel stages with conversion rates relative to top of funnel
        List<FunnelStage> funnel = new ArrayList<>();
        double base = Math.max(1, totalApplications);
        funnel.add(new FunnelStage("Applications", totalApplications, 100.0));
        funnel.add(new FunnelStage("Shortlisted", totalShortlisted, round(totalShortlisted * 100.0 / base)));
        funnel.add(new FunnelStage("Assessed", totalAssessed, round(totalAssessed * 100.0 / base)));
        funnel.add(new FunnelStage("Interviewed", totalInterviews, round(totalInterviews * 100.0 / base)));
        funnel.add(new FunnelStage("Offered", totalOffers, round(totalOffers * 100.0 / base)));
        funnel.add(new FunnelStage("Hired", totalHires, round(totalHires * 100.0 / base)));

        // Per-internship stats
        List<InternshipStat> stats = getInternshipStats(companyId, internshipId);

        return new CompanyAnalyticsSummary(
                totalInternships, openInternships, totalApplications, totalShortlisted, totalAssessed,
                avgScore != null ? round(avgScore) : null,
                totalInterviews, totalOffers, totalHires, offerAcceptanceRate,
                activePlacements, completedPlacements, totalTasks, tasksReviewed, taskCompletionRate,
                funnel, stats);
    }

    @Transactional(readOnly = true)
    public String exportCsv(Long companyId, Long internshipId) {
        StringBuilder csv = new StringBuilder();
        csv.append("Application ID,Candidate Name,Candidate Email,Internship Title,Round,Status,Test Score %,Interview Result,Offer Status,Placement Status\n");

        String filter = internshipId != null ? " and i.id = :iid" : "";
        String sql = """
                select a.id, u.full_name, u.email, i.title, a.current_round, a.status,
                       (select round(avg(ta.score * 100.0 / nullif(ta.total, 0))) from test_attempts ta where ta.application_id = a.id and ta.score is not null),
                       (select iv.outcome from interviews iv where iv.application_id = a.id order by iv.id desc limit 1),
                       (select o.status from offers o where o.application_id = a.id order by o.id desc limit 1),
                       (select p.status from placements p where p.application_id = a.id order by p.id desc limit 1)
                from applications a
                join internships i on i.id = a.internship_id
                join users u on u.id = a.student_id
                where i.company_id = :cid""" + filter + " order by a.created_at desc";

        Query q = em.createNativeQuery(sql);
        q.setParameter("cid", companyId);
        if (internshipId != null) {
            q.setParameter("iid", internshipId);
        }

        List<?> rows = q.getResultList();
        for (Object rowObj : rows) {
            Object[] row = (Object[]) rowObj;
            for (int j = 0; j < row.length; j++) {
                String val = row[j] != null ? row[j].toString().replace("\"", "\"\"") : "";
                csv.append('"').append(val).append('"');
                if (j < row.length - 1) csv.append(',');
            }
            csv.append('\n');
        }

        return csv.toString();
    }

    private List<InternshipStat> getInternshipStats(Long companyId, Long internshipId) {
        String filter = internshipId != null ? " and i.id = :iid" : "";
        String sql = """
                select i.id, i.title, i.status, i.openings,
                       count(distinct a.id) as app_cnt,
                       count(distinct case when a.status in ('SHORTLISTED', 'OFFERED', 'SELECTED') then a.id end) as short_cnt,
                       count(distinct case when iv.status = 'COMPLETED' then a.id end) as int_cnt,
                       count(distinct o.id) as off_cnt,
                       count(distinct case when o.status = 'ACCEPTED' then o.id end) as hire_cnt,
                       avg(ta.score * 100.0 / nullif(ta.total, 0)) as avg_score
                from internships i
                left join applications a on a.internship_id = i.id
                left join interviews iv on iv.application_id = a.id
                left join offers o on o.application_id = a.id
                left join test_attempts ta on ta.application_id = a.id and ta.score is not null and ta.total > 0
                where i.company_id = :cid""" + filter + """
                group by i.id, i.title, i.status, i.openings
                order by i.created_at desc""";

        Query q = em.createNativeQuery(sql);
        q.setParameter("cid", companyId);
        if (internshipId != null) {
            q.setParameter("iid", internshipId);
        }

        List<?> list = q.getResultList();
        List<InternshipStat> result = new ArrayList<>();
        for (Object item : list) {
            Object[] c = (Object[]) item;
            Long id = ((Number) c[0]).longValue();
            String title = (String) c[1];
            String status = (String) c[2];
            int openings = ((Number) c[3]).intValue();
            long applicants = ((Number) c[4]).longValue();
            long shortlisted = ((Number) c[5]).longValue();
            long interviews = ((Number) c[6]).longValue();
            long offers = ((Number) c[7]).longValue();
            long hires = ((Number) c[8]).longValue();
            Double avgScore = c[9] != null ? round(((Number) c[9]).doubleValue()) : null;

            result.add(new InternshipStat(id, title, status, openings, applicants, shortlisted, interviews, offers, hires, avgScore));
        }
        return result;
    }

    private long queryCount(String sql, Long cid, Long iid) {
        Query q = em.createNativeQuery(sql);
        q.setParameter("cid", cid);
        if (iid != null) q.setParameter("iid", iid);
        Object single = q.getSingleResult();
        return single != null ? ((Number) single).longValue() : 0L;
    }

    private Double queryAvg(String sql, Long cid, Long iid) {
        Query q = em.createNativeQuery(sql);
        q.setParameter("cid", cid);
        if (iid != null) q.setParameter("iid", iid);
        Object single = q.getSingleResult();
        return single != null ? ((Number) single).doubleValue() : null;
    }

    private double round(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
