package com.internflow.skillgap;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.internflow.skillgap.SkillGapDtos.SkillGapAnalysis;

@RestController
@RequestMapping("/api/company/skillgap")
public class CompanySkillGapController {

    private final SkillGapService skillGapService;

    public CompanySkillGapController(SkillGapService skillGapService) {
        this.skillGapService = skillGapService;
    }

    @GetMapping("/applicant/{applicationId}")
    public SkillGapAnalysis analyzeApplicant(@AuthenticationPrincipal Jwt jwt, @PathVariable("applicationId") Long applicationId) {
        Long companyId = Long.valueOf(jwt.getSubject());
        return skillGapService.analyzeForApplication(companyId, applicationId);
    }
}
