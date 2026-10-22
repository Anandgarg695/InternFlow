package com.internflow.screening;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.internflow.application.ApplicationStatus;
import com.internflow.application.InternshipApplication;
import com.internflow.application.InternshipApplicationRepository;
import com.internflow.common.ApiException;
import com.internflow.internship.InternshipRepository;
import com.internflow.screening.ScreeningDtos.QuestionRequest;
import com.internflow.screening.ScreeningDtos.QuestionResponse;
import com.internflow.screening.ScreeningDtos.ResultResponse;
import com.internflow.screening.ScreeningDtos.StartResponse;
import com.internflow.screening.ScreeningDtos.StudentQuestion;
import com.internflow.screening.ScreeningDtos.SubmitRequest;
import com.internflow.screening.ScreeningDtos.SubmitResponse;
import com.internflow.screening.ScreeningDtos.TestInfoResponse;
import com.internflow.screening.ScreeningDtos.TestRequest;
import com.internflow.screening.ScreeningDtos.TestResponse;
import com.internflow.screening.ScreeningDtos.TestResultsResponse;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class ScreeningTestService {

    // A submission may arrive a little after the deadline because of network delay
    private static final long GRACE_SECONDS = 15;

    private final ScreeningTestRepository testRepository;
    private final TestQuestionRepository questionRepository;
    private final TestAttemptRepository attemptRepository;
    private final InternshipRepository internshipRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public ScreeningTestService(ScreeningTestRepository testRepository,
            TestQuestionRepository questionRepository,
            TestAttemptRepository attemptRepository,
            InternshipRepository internshipRepository,
            InternshipApplicationRepository applicationRepository,
            UserRepository userRepository) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.attemptRepository = attemptRepository;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    // ---------------------------------------------------------------- company side

    @Transactional(readOnly = true)
    public TestResponse getForCompany(Long companyId, Long internshipId) {
        requireOwnInternship(companyId, internshipId);
        ScreeningTest test = testRepository.findByInternshipId(internshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No screening test for this internship"));
        List<TestQuestion> questions = questionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        return toTestResponse(test, questions, attemptRepository.existsByTestId(test.getId()));
    }

    @Transactional
    public TestResponse save(Long companyId, Long internshipId, TestRequest request) {
        requireOwnInternship(companyId, internshipId);

        ScreeningTest test = testRepository.findByInternshipId(internshipId).orElse(null);
        if (test == null) {
            test = new ScreeningTest();
            test.setInternshipId(internshipId);
        } else if (attemptRepository.existsByTestId(test.getId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Students have already started this test, so it can no longer be changed");
        }
        test.setTitle(request.title().trim());
        test.setDurationMinutes(request.durationMinutes());
        test = testRepository.save(test);

        // Replace all questions with the new list
        questionRepository.deleteByTestId(test.getId());
        List<TestQuestion> created = new ArrayList<>();
        for (int i = 0; i < request.questions().size(); i++) {
            QuestionRequest q = request.questions().get(i);
            TestQuestion question = new TestQuestion();
            question.setTestId(test.getId());
            question.setSortOrder(i);
            question.setQuestionText(q.text().trim());
            question.setOptions(q.options().stream().map(String::trim).toList());
            question.setCorrectOption(q.correctOption());
            created.add(question);
        }
        questionRepository.saveAll(created);
        return toTestResponse(test, created, false);
    }

    @Transactional
    public void delete(Long companyId, Long internshipId) {
        requireOwnInternship(companyId, internshipId);
        ScreeningTest test = testRepository.findByInternshipId(internshipId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No screening test for this internship"));
        if (attemptRepository.existsByTestId(test.getId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Students have already started this test, so it can no longer be deleted");
        }
        testRepository.delete(test);
    }

    @Transactional(readOnly = true)
    public TestResultsResponse results(Long companyId, Long internshipId) {
        requireOwnInternship(companyId, internshipId);
        Optional<ScreeningTest> test = testRepository.findByInternshipId(internshipId);
        if (test.isEmpty()) {
            return new TestResultsResponse(false, List.of());
        }

        List<TestAttempt> attempts = attemptRepository.findByTestId(test.get().getId());
        Map<Long, InternshipApplication> applications = applicationRepository
                .findAllById(attempts.stream().map(TestAttempt::getApplicationId).toList()).stream()
                .collect(Collectors.toMap(InternshipApplication::getId, Function.identity()));
        Map<Long, User> users = userRepository
                .findAllById(applications.values().stream().map(InternshipApplication::getStudentId)
                        .collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        Instant now = Instant.now();
        List<ResultResponse> results = attempts.stream().map(a -> {
            InternshipApplication application = applications.get(a.getApplicationId());
            User user = application == null ? null : users.get(application.getStudentId());
            AttemptState state = stateOf(a, now);
            boolean submitted = state == AttemptState.SUBMITTED;
            return new ResultResponse(a.getApplicationId(),
                    user == null ? null : user.getFullName(),
                    user == null ? null : user.getEmail(),
                    state,
                    submitted ? a.getScore() : null,
                    submitted ? a.getTotal() : null,
                    a.getSubmittedAt());
        }).toList();
        return new TestResultsResponse(true, results);
    }

    // ---------------------------------------------------------------- student side

    @Transactional(readOnly = true)
    public TestInfoResponse info(Long studentId, Long applicationId) {
        InternshipApplication application = ownApplication(studentId, applicationId);
        ScreeningTest test = testRepository.findByInternshipId(application.getInternshipId()).orElse(null);
        if (test == null) {
            return new TestInfoResponse(AttemptState.NO_TEST, null, null, null, null, null);
        }

        int questionCount = (int) questionRepository.countByTestId(test.getId());
        TestAttempt attempt = attemptRepository.findByApplicationId(applicationId).orElse(null);
        AttemptState state = attempt == null ? AttemptState.NOT_STARTED : stateOf(attempt, Instant.now());
        boolean submitted = state == AttemptState.SUBMITTED;
        return new TestInfoResponse(state, test.getTitle(), test.getDurationMinutes(), questionCount,
                submitted ? attempt.getScore() : null, submitted ? attempt.getTotal() : null);
    }

    @Transactional
    public StartResponse start(Long studentId, Long applicationId) {
        InternshipApplication application = ownApplication(studentId, applicationId);
        requireShortlisted(application);
        ScreeningTest test = testRepository.findByInternshipId(application.getInternshipId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No screening test for this internship"));
        List<TestQuestion> questions = questionRepository.findByTestIdOrderBySortOrderAsc(test.getId());

        Instant now = Instant.now();
        TestAttempt attempt = attemptRepository.findByApplicationId(applicationId).orElse(null);
        if (attempt == null) {
            attempt = new TestAttempt();
            attempt.setTestId(test.getId());
            attempt.setApplicationId(applicationId);
            attempt.setStartedAt(now);
            attempt.setDeadlineAt(now.plus(test.getDurationMinutes(), ChronoUnit.MINUTES));
            attempt = attemptRepository.save(attempt);
        } else {
            AttemptState state = stateOf(attempt, now);
            if (state == AttemptState.SUBMITTED) {
                throw new ApiException(HttpStatus.CONFLICT, "You have already submitted this test");
            }
            if (state == AttemptState.EXPIRED) {
                throw new ApiException(HttpStatus.CONFLICT, "The time for this test has run out");
            }
        }

        List<StudentQuestion> visible = questions.stream()
                .map(q -> new StudentQuestion(q.getQuestionText(), q.options()))
                .toList();
        return new StartResponse(test.getTitle(), test.getDurationMinutes(), attempt.getDeadlineAt(), now, visible);
    }

    @Transactional
    public SubmitResponse submit(Long studentId, Long applicationId, SubmitRequest request) {
        InternshipApplication application = ownApplication(studentId, applicationId);
        requireShortlisted(application);
        TestAttempt attempt = attemptRepository.findByApplicationId(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Start the test before submitting it"));

        Instant now = Instant.now();
        AttemptState state = stateOf(attempt, now);
        if (state == AttemptState.SUBMITTED) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already submitted this test");
        }
        if (state == AttemptState.EXPIRED) {
            throw new ApiException(HttpStatus.CONFLICT, "The time for this test has run out");
        }

        List<TestQuestion> questions = questionRepository.findByTestIdOrderBySortOrderAsc(attempt.getTestId());
        List<Integer> answers = request.answers();
        if (answers.size() > questions.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Too many answers for this test");
        }

        int score = 0;
        for (int i = 0; i < questions.size(); i++) {
            Integer chosen = i < answers.size() ? answers.get(i) : null;
            if (chosen == null) {
                continue; // left unanswered
            }
            if (chosen < 0 || chosen > 3) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid answer for question " + (i + 1));
            }
            if (chosen == questions.get(i).getCorrectOption()) {
                score++;
            }
        }

        attempt.setSubmittedAt(now);
        attempt.setScore(score);
        attempt.setTotal(questions.size());
        attemptRepository.save(attempt);
        return new SubmitResponse(score, questions.size());
    }

    // ---------------------------------------------------------------- helpers

    private void requireOwnInternship(Long companyId, Long internshipId) {
        // Someone else's internship looks exactly like a missing one
        internshipRepository.findByIdAndCompanyId(internshipId, companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Internship not found"));
    }

    private InternshipApplication ownApplication(Long studentId, Long applicationId) {
        return applicationRepository.findByIdAndStudentId(applicationId, studentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
    }

    private void requireShortlisted(InternshipApplication application) {
        if (application.getStatus() != ApplicationStatus.SHORTLISTED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only shortlisted applicants can take the screening test");
        }
    }

    private AttemptState stateOf(TestAttempt attempt, Instant now) {
        if (attempt.getSubmittedAt() != null) {
            return AttemptState.SUBMITTED;
        }
        if (now.isAfter(attempt.getDeadlineAt().plusSeconds(GRACE_SECONDS))) {
            return AttemptState.EXPIRED;
        }
        return AttemptState.IN_PROGRESS;
    }

    private TestResponse toTestResponse(ScreeningTest test, List<TestQuestion> questions, boolean locked) {
        List<QuestionResponse> items = questions.stream()
                .map(q -> new QuestionResponse(q.getQuestionText(), q.options(), q.getCorrectOption()))
                .toList();
        return new TestResponse(test.getId(), test.getTitle(), test.getDurationMinutes(), locked, items);
    }
}