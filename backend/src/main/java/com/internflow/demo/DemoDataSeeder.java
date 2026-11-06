package com.internflow.demo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.application.ApplicationStatus;
import com.internflow.application.InternshipApplication;
import com.internflow.application.InternshipApplicationRepository;
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.internship.InternshipStatus;
import com.internflow.internship.WorkMode;
import com.internflow.placement.MentorLink;
import com.internflow.placement.MentorLinkRepository;
import com.internflow.profile.CompanyProfile;
import com.internflow.profile.CompanyProfileRepository;
import com.internflow.profile.StudentProfile;
import com.internflow.profile.StudentProfileRepository;
import com.internflow.screening.ScreeningTest;
import com.internflow.screening.ScreeningTestRepository;
import com.internflow.screening.TestQuestion;
import com.internflow.screening.TestQuestionRepository;
import com.internflow.user.Role;
import com.internflow.user.RoleRepository;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Component
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentProfileRepository studentProfileRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final InternshipRepository internshipRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final ScreeningTestRepository testRepository;
    private final TestQuestionRepository questionRepository;
    private final MentorLinkRepository mentorLinkRepository;

    public DemoDataSeeder(UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            StudentProfileRepository studentProfileRepository,
            CompanyProfileRepository companyProfileRepository,
            InternshipRepository internshipRepository,
            InternshipApplicationRepository applicationRepository,
            ScreeningTestRepository testRepository,
            TestQuestionRepository questionRepository,
            MentorLinkRepository mentorLinkRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.studentProfileRepository = studentProfileRepository;
        this.companyProfileRepository = companyProfileRepository;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.mentorLinkRepository = mentorLinkRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail("student@internflow.local")) {
            return;
        }
        seed();
    }

    @Transactional
    public void seed() {
        if (userRepository.existsByEmail("student@internflow.local")) {
            return;
        }
        log.info("Seeding InternFlow demo data...");

        Role studentRole = roleRepository.findByName("STUDENT").orElseThrow();
        Role companyRole = roleRepository.findByName("COMPANY").orElseThrow();
        Role mentorRole = roleRepository.findByName("MENTOR").orElseThrow();
        String passHash = passwordEncoder.encode("password123");

        // 1. Users
        User studentAarav = createUser("student@internflow.local", "Aarav Sharma", passHash, studentRole, true);
        User studentPriya = createUser("priya@internflow.local", "Priya Patel", passHash, studentRole, true);
        User compTech = createUser("company@internflow.local", "TechCorp Recruiter", passHash, companyRole, true);
        User compCloud = createUser("cloudscale@internflow.local", "CloudScale HR", passHash, companyRole, true);
        User mentorVikram = createUser("mentor@internflow.local", "Dr. Vikram Mehta", passHash, mentorRole, true);

        // 2. Profiles
        createStudentProfile(studentAarav, "IIT Bombay", "B.Tech", "Computer Science", 2026,
                BigDecimal.valueOf(8.9), "Java, Spring Boot, React, PostgreSQL, Docker, Git",
                "Full-stack web developer passionate about high-concurrency systems.");

        createStudentProfile(studentPriya, "BITS Pilani", "B.E.", "Information Technology", 2026,
                BigDecimal.valueOf(9.2), "Python, PyTorch, Machine Learning, Data Analysis, SQL",
                "AI researcher focused on NLP and deep learning applications.");

        createCompanyProfile(compTech, "TechCorp Innovations", "Enterprise SaaS", "Bangalore, India",
                "https://techcorp.example.com", "Building modern enterprise tools and developer platforms.");

        createCompanyProfile(compCloud, "CloudScale Systems", "Cloud & Infrastructure", "Hyderabad, India",
                "https://cloudscale.example.com", "Next-generation cloud infrastructure and container orchestration.");

        // 3. Internships
        Internship intern1 = createInternship(compTech.getId(), "Full Stack Developer Intern",
                "Join our core product team to develop high-performance REST APIs with Spring Boot and reactive React interfaces.",
                "Java, Spring Boot, React, PostgreSQL, Git", WorkMode.HYBRID, "Bangalore", 12, 35000, 3);

        Internship intern2 = createInternship(compTech.getId(), "AI & Machine Learning Research Intern",
                "Work on training, fine-tuning, and evaluating neural models for production document understanding.",
                "Python, PyTorch, Machine Learning, Docker", WorkMode.REMOTE, "Remote", 16, 40000, 2);

        createInternship(compCloud.getId(), "Cloud Infrastructure & DevOps Intern",
                "Maintain and scale multi-region Kubernetes clusters, build CI/CD pipelines, and automate AWS workflows.",
                "Docker, Kubernetes, AWS, Linux, Python", WorkMode.ONSITE, "Hyderabad", 24, 30000, 4);

        // 4. Screening Test for Full Stack Intern
        ScreeningTest test = new ScreeningTest();
        test.setInternshipId(intern1.getId());
        test.setRoundNumber(1);
        test.setTitle("Full Stack & Spring Fundamentals");
        test.setDurationMinutes(20);
        testRepository.save(test);

        createQuestion(test.getId(), 1, "Which Spring annotation marks a class as a REST controller?",
                "@Controller", "@RestController", "@Service", "@Endpoint", 1);
        createQuestion(test.getId(), 2, "Which React hook is commonly used to execute side effects?",
                "useState", "useMemo", "useEffect", "useCallback", 2);
        createQuestion(test.getId(), 3, "What does the 'I' in ACID database transactions stand for?",
                "Integrity", "Isolation", "Inheritance", "Iteration", 1);

        // 5. Applications
        InternshipApplication app1 = new InternshipApplication();
        app1.setInternshipId(intern1.getId());
        app1.setStudentId(studentAarav.getId());
        app1.setCoverNote("Excited to contribute to TechCorp's full-stack stack!");
        app1.setStatus(ApplicationStatus.SHORTLISTED);
        app1.setCurrentRound(1);
        applicationRepository.save(app1);

        InternshipApplication app2 = new InternshipApplication();
        app2.setInternshipId(intern2.getId());
        app2.setStudentId(studentPriya.getId());
        app2.setCoverNote("Passionate about ML research with PyTorch.");
        app2.setStatus(ApplicationStatus.APPLIED);
        app2.setCurrentRound(0);
        applicationRepository.save(app2);

        // 6. Mentor Link
        MentorLink link = new MentorLink();
        link.setCompanyId(compTech.getId());
        link.setMentorId(mentorVikram.getId());
        link.setStatus(MentorLink.Status.ACTIVE);
        mentorLinkRepository.save(link);

        log.info("Demo data seeded successfully.");
    }

    private User createUser(String email, String fullName, String passHash, Role role, boolean approved) {
        User u = new User();
        u.setEmail(email);
        u.setFullName(fullName);
        u.setPasswordHash(passHash);
        u.setRole(role);
        u.setEnabled(true);
        u.setApproved(approved);
        return userRepository.save(u);
    }

    private void createStudentProfile(User u, String uni, String degree, String branch, int year,
            BigDecimal cgpa, String skills, String bio) {
        StudentProfile p = new StudentProfile();
        p.setUser(u);
        p.setUniversity(uni);
        p.setDegree(degree);
        p.setBranch(branch);
        p.setGraduationYear(year);
        p.setCgpa(cgpa);
        p.setSkills(skills);
        p.setBio(bio);
        p.setPhone("+91 98765 43210");
        studentProfileRepository.save(p);
    }

    private void createCompanyProfile(User u, String name, String industry, String loc, String web, String desc) {
        CompanyProfile p = new CompanyProfile();
        p.setUser(u);
        p.setCompanyName(name);
        p.setIndustry(industry);
        p.setLocation(loc);
        p.setWebsite(web);
        p.setDescription(desc);
        p.setCompanySize("50-200");
        companyProfileRepository.save(p);
    }

    private Internship createInternship(Long compId, String title, String desc, String skills,
            WorkMode mode, String loc, int weeks, int stipend, int openings) {
        Internship i = new Internship();
        i.setCompanyId(compId);
        i.setTitle(title);
        i.setDescription(desc);
        i.setSkillsRequired(skills);
        i.setWorkMode(mode);
        i.setLocation(loc);
        i.setDurationWeeks(weeks);
        i.setStipendPerMonth(stipend);
        i.setOpenings(openings);
        i.setApplicationDeadline(LocalDate.now().plusMonths(2));
        i.setStatus(InternshipStatus.OPEN);
        return internshipRepository.save(i);
    }

    private void createQuestion(Long testId, int order, String text, String a, String b, String c, String d, int correct) {
        TestQuestion q = new TestQuestion();
        q.setTestId(testId);
        q.setSortOrder(order);
        q.setQuestionText(text);
        q.setOptionA(a);
        q.setOptionB(b);
        q.setOptionC(c);
        q.setOptionD(d);
        q.setCorrectOption(correct);
        questionRepository.save(q);
    }
}
