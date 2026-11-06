package com.internflow.skillgap;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.application.InternshipApplication;
import com.internflow.application.InternshipApplicationRepository;
import com.internflow.common.ApiException;
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.internship.InternshipStatus;
import com.internflow.profile.StudentProfile;
import com.internflow.profile.StudentProfileRepository;
import com.internflow.skillgap.SkillGapDtos.InternshipMatchScore;
import com.internflow.skillgap.SkillGapDtos.SkillGapAnalysis;
import com.internflow.skillgap.SkillGapDtos.SkillRecommendation;

@Service
public class SkillGapService {

    private static final Map<String, String> CURATED_RESOURCES = Map.ofEntries(
            Map.entry("react", "https://react.dev/learn"),
            Map.entry("reactjs", "https://react.dev/learn"),
            Map.entry("javascript", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"),
            Map.entry("typescript", "https://www.typescriptlang.org/docs/handbook/intro.html"),
            Map.entry("python", "https://docs.python.org/3/tutorial/"),
            Map.entry("java", "https://dev.java/learn/"),
            Map.entry("springboot", "https://spring.io/guides"),
            Map.entry("spring", "https://spring.io/guides"),
            Map.entry("docker", "https://docs.docker.com/get-started/"),
            Map.entry("kubernetes", "https://kubernetes.io/docs/tutorials/"),
            Map.entry("postgresql", "https://www.postgresql.org/docs/current/tutorial.html"),
            Map.entry("postgres", "https://www.postgresql.org/docs/current/tutorial.html"),
            Map.entry("sql", "https://www.w3schools.com/sql/"),
            Map.entry("git", "https://git-scm.com/doc"),
            Map.entry("aws", "https://aws.amazon.com/getting-started/"),
            Map.entry("node", "https://nodejs.org/en/learn"),
            Map.entry("nodejs", "https://nodejs.org/en/learn"),
            Map.entry("html", "https://developer.mozilla.org/en-US/docs/Web/HTML"),
            Map.entry("css", "https://developer.mozilla.org/en-US/docs/Web/CSS"),
            Map.entry("tailwind", "https://tailwindcss.com/docs"),
            Map.entry("linux", "https://linuxjourney.com/")
    );

    private final StudentProfileRepository studentProfileRepository;
    private final InternshipRepository internshipRepository;
    private final InternshipApplicationRepository applicationRepository;

    public SkillGapService(StudentProfileRepository studentProfileRepository,
            InternshipRepository internshipRepository,
            InternshipApplicationRepository applicationRepository) {
        this.studentProfileRepository = studentProfileRepository;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
    }

    public SkillGapAnalysis analyze(String studentSkillsRaw, String requiredSkillsRaw) {
        List<String> requiredList = parseTokens(requiredSkillsRaw);
        if (requiredList.isEmpty()) {
            return new SkillGapAnalysis(100, List.of(), List.of(), List.of());
        }

        List<String> studentList = parseTokens(studentSkillsRaw);
        Set<String> normalizedStudent = studentList.stream()
                .map(this::normalize)
                .collect(Collectors.toSet());

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (String req : requiredList) {
            String normReq = normalize(req);
            boolean found = normalizedStudent.contains(normReq)
                    || normalizedStudent.stream().anyMatch(s -> s.contains(normReq) || normReq.contains(s));
            if (found) {
                matched.add(req);
            } else {
                missing.add(req);
            }
        }

        int score = (int) Math.round(((double) matched.size() / requiredList.size()) * 100);
        List<SkillRecommendation> recommendations = missing.stream()
                .map(this::toRecommendation)
                .toList();

        return new SkillGapAnalysis(score, matched, missing, recommendations);
    }

    @Transactional(readOnly = true)
    public SkillGapAnalysis analyzeForStudent(Long studentId, Long internshipId) {
        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
        String studentSkills = studentProfileRepository.findByUserId(studentId)
                .map(StudentProfile::getSkills)
                .orElse("");
        return analyze(studentSkills, internship.getSkillsRequired());
    }

    @Transactional(readOnly = true)
    public List<InternshipMatchScore> batchScoresForStudent(Long studentId) {
        String studentSkills = studentProfileRepository.findByUserId(studentId)
                .map(StudentProfile::getSkills)
                .orElse("");
        List<Internship> activeInternships = internshipRepository.findByStatus(InternshipStatus.OPEN);

        return activeInternships.stream().map(i -> {
            SkillGapAnalysis analysis = analyze(studentSkills, i.getSkillsRequired());
            return new InternshipMatchScore(i.getId(), analysis.matchScore());
        }).toList();
    }

    @Transactional(readOnly = true)
    public SkillGapAnalysis analyzeForApplication(Long companyId, Long applicationId) {
        InternshipApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        Internship internship = internshipRepository.findByIdAndCompanyId(app.getInternshipId(), companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));

        String studentSkills = studentProfileRepository.findByUserId(app.getStudentId())
                .map(StudentProfile::getSkills)
                .orElse("");
        return analyze(studentSkills, internship.getSkillsRequired());
    }

    private List<String> parseTokens(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(raw.split("[,;\\n\\/]+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList();
    }

    private String normalize(String skill) {
        return skill.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private SkillRecommendation toRecommendation(String skill) {
        String key = normalize(skill);
        String url = CURATED_RESOURCES.getOrDefault(key,
                "https://www.google.com/search?q=" + URLEncoder.encode(skill + " tutorial documentation", StandardCharsets.UTF_8));
        String suggestion = "Build proficiency in " + skill + " to boost eligibility for this position.";
        return new SkillRecommendation(skill, suggestion, url);
    }
}
