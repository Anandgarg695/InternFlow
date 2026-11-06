package com.internflow.analytics;

import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.analytics.CompanyAnalyticsDtos.CompanyAnalyticsSummary;

@RestController
@RequestMapping("/api/company/analytics")
public class CompanyAnalyticsController {

    private final CompanyAnalyticsService service;

    public CompanyAnalyticsController(CompanyAnalyticsService service) {
        this.service = service;
    }

    @GetMapping
    public CompanyAnalyticsSummary getAnalytics(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "internshipId", required = false) Long internshipId) {
        return service.getAnalytics(companyId(jwt), internshipId);
    }

    @GetMapping(value = "/export")
    public ResponseEntity<byte[]> exportCsv(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "internshipId", required = false) Long internshipId) {
        String csv = service.exportCsv(companyId(jwt), internshipId);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"internflow-recruitment-analytics.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    private Long companyId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
