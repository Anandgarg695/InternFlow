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
import com.internflow.screening.ScreeningDtos.AdvanceResponse;
import com.internflow.screening.ScreeningDtos.QuestionRequest;
import com.internflow.screening.ScreeningDtos.QuestionResponse;
import com.internflow.screening.ScreeningDtos.ResultResponse;
import com.internflow.screening.ScreeningDtos.RoundSummary;
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
    private static final int MAX_ROUNDS = 10;

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
    public List<RoundSummary> listRounds(Long companyId, Long internshipId) {
        requireOwnInternship(companyId, internshipId);
        return testRepository.findByInternshipIdOrderByRoundNumberAsc(internshipId).stream()
                .map(t -> new RoundSummary(t.getRoundNumber(), t.getTitle(), t.getDurationMinutes(),
                        (int) questionRepository.countByTestId(t.getId()),
                        attemptRepository.existsByTestId(t.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public TestResponse getForCompany(Long companyId, Long internshipId, int round) {
        requireOwnInternship(companyId, internshipId);
        ScreeningTest test = testRepository.findByInternshipIdAndRoundNumber(internshipId, round)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "There is no test for this round"));
        List<TestQuestion> questions = questionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        return toTestResponse(test, questions, attemptRepository.existsByTestId(test.getId()));
    }

    @Transactional
    public TestResponse save(Long companyId, Long internshipId, int round, TestRequest request) {
        requireOwnInternship(companyId, internshipId);
        if (round < 1 || round > MAX_ROUNDS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Round must be between 1 and " + MAX_ROUNDS);
        }

        ScreeningTest test = testRepository.findByInternshipIdAndRoundNumber(internshipId, round).orElse(null);
        if (test == null) {
            if (round > 1 && testRepository.findByInternshipIdAndRoundNumber(internshipId, round - 1).isEmpty()) {
                throw new ApiException(HttpStatus.CONFLICT, "Create round " + (round - 1) + " first");
            }
            test = new ScreeningTest();
            test.setInternshipId(internshipId);
            test.setRoundNumber(round);
        } else if (attemptRepository.existsByTestId(test.getId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Students have already started this round, so it can no longer be changed");
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
    public void delete(Long companyId, Long internshipId, int round) {
        requireOwnInternship(companyId, internshipId);
        ScreeningTest test = testRepository.findByInternshipIdAndRoundNumber(internshipId, round)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "There is no test for this round"));
        if (testRepository.findByInternshipIdAndRoundNumber(internshipId, round + 1).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Delete the later rounds first");
        }
        if (attemptRepository.existsByTestId(test.getId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Students have already started this round, so it can no longer be deleted");
        }
        testRepository.delete(test);
    }

    @Transactional(readOnly = true)
    public TestResultsResponse results(Long companyId, Long internshipId) {
        requireOwnInternship(companyId, internshipId);
        List<ScreeningTest> tests = testRepository.findByInternshipIdOrderByRoundNumberAsc(internshipId);
        if (tests.isEmpty()) {
            return new TestResultsResponse(false, 0, List.of());
        }

        Map<Long, Integer> roundByTest = tests.stream()
                .collect(Collectors.toMap(ScreeningTest::getId, ScreeningTest::getRoundNumber));
        List<TestAttempt> attempts = attemptRepository.findByTestIdIn(roundByTest.keySet());

        Map<Long, InternshipApplication> applications = applicationRepository
                .findAllById(attempts.stream().map(TestAttempt::getApplicationId).collect(Collectors.toSet()))
                .stream()
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
            return new ResultResponse(a.getApplicationId(), roundByTest.get(a.getTestId()),
                    user == null ? null : user.getFullName(),
                    user == null ? null : user.getEmail(),
                    state,
                    submitted ? a.getScore() : null,
                    submitted ? a.getTotal() : null,
                    a.getSubmittedAt());
        }).toList();
        return new TestResultsResponse(true, tests.size(), results);
    }

    @Transactional
    public AdvanceResponse advance(Long companyId, Long applicationId) {
        InternshipApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        internshipRepository.findByIdAndCompanyId(application.getInternshipId(), companyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));

        if (application.getStatus() != ApplicationStatus.SHORTLISTED) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Only shortlisted applicants can be moved to the next round");
        }

        int current = roundOf(application);
        if (current >= MAX_ROUNDS) {
            throw new ApiException(HttpStatus.CONFLICT, "This applicant is already in the last possible round");
        }

        // If the current round has a test, the applicant must have finished it (submitted or timed out)
        Optional<ScreeningTest> test = testRepository
                .findByInternshipIdAndRoundNumber(application.getInternshipId(), current);
        if (test.isPresent()) {
            TestAttempt attempt = attemptRepository
                    .findByApplicationIdAndTestId(applicationId, test.get().getId()).orElse(null);
            AttemptState state = attempt == null ? AttemptState.NOT_STARTED : stateOf(attempt, Instant.now());
            if (state == AttemptState.NOT_STARTED || state == AttemptState.IN_PROGRESS) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "The applicant has not finished round " + current + " yet");
            }
        }

        application.setCurrentRound(current + 1);
        applicationRepository.save(application);
        return new AdvanceResponse(application.getId(), application.getCurrentRound());
    }

    // ---------------------------------------------------------------- student side

    @Transactional(readOnly = true)
    public TestInfoResponse info(Long studentId, Long applicationId) {
        InternshipApplication application = ownApplication(studentId, applicationId);
        int round = roundOf(application);
        List<ScreeningTest> tests = testRepository
                .findByInternshipIdOrderByRoundNumberAsc(application.getInternshipId());
        int totalRounds = tests.size();

        ScreeningTest test = tests.stream().filter(t -> t.getRoundNumber() == round).findFirst().orElse(null);
        if (test == null) {
            return new TestInfoResponse(AttemptState.NO_TEST, round, totalRounds, null, null, null, null, null);
        }

        int questionCount = (int) questionRepository.countByTestId(test.getId());
        TestAttempt attempt = attemptRepository.findByApplicationIdAndTestId(applicationId, test.getId())
                .orElse(null);
        AttemptState state = attempt == null ? AttemptState.NOT_STARTED : stateOf(attempt, Instant.now());
        boolean submitted = state == AttemptState.SUBMITTED;
        return new TestInfoResponse(state, round, totalRounds, test.getTitle(), test.getDurationMinutes(),
                questionCount, submitted ? attempt.getScore() : null, submitted ? attempt.getTotal() : null);
    }

    @Transactional
    public StartResponse start(Long studentId, Long applicationId) {
        InternshipApplication application = ownApplication(studentId, applicationId);
        requireShortlisted(application);
        ScreeningTest test = currentTest(application)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "There is no test for your current round"));
        List<TestQuestion> questions = questionRepository.findByTestIdOrderBySortOrderAsc(test.getId());

        Instant now = Instant.now();
        TestAttempt attempt = attemptRepository.findByApplicationIdAndTestId(applicationId, test.getId())
                .orElse(null);
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
        ScreeningTest test = currentTest(application)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "There is no test for your current round"));
        TestAttempt attempt = attemptRepository.findByApplicationIdAndTestId(applicationId, test.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Start the test before submitting it"));

        Instant now = Instant.now();
        AttemptState state = stateOf(attempt, now);
        if (state == AttemptState.SUBMITTED) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already submitted this test");
        }
        if (state == AttemptState.EXPIRED) {
            throw new ApiException(HttpStatus.CONFLICT, "The time for this test has run out");
        }

        List<TestQuestion> questions = questionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
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
            throw new ApiException(HttpStatus.CONFLICT, "Only shortlisted applicants can take the tests");
        }
    }

    private int roundOf(InternshipApplication application) {
        return Math.max(application.getCurrentRound(), 1);
    }

    private Optional<ScreeningTest> currentTest(InternshipApplication application) {
        return testRepository.findByInternshipIdAndRoundNumber(application.getInternshipId(), roundOf(application));
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
        return new TestResponse(test.getId(), test.getRoundNumber(), test.getTitle(), test.getDurationMinutes(),
                locked, items);
    }
}