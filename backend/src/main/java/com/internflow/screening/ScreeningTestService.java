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
import com.internflow.internship.Internship;
import com.internflow.internship.InternshipRepository;
import com.internflow.notification.NotificationService;
import com.internflow.screening.ScreeningDtos.AdvanceResponse;
import com.internflow.screening.ScreeningDtos.GradeItemRequest;
import com.internflow.screening.ScreeningDtos.GradeTheoryRequest;
import com.internflow.screening.ScreeningDtos.QuestionRequest;
import com.internflow.screening.ScreeningDtos.QuestionResponse;
import com.internflow.screening.ScreeningDtos.ResultResponse;
import com.internflow.screening.ScreeningDtos.RoundSummary;
import com.internflow.screening.ScreeningDtos.StartResponse;
import com.internflow.screening.ScreeningDtos.StudentQuestion;
import com.internflow.screening.ScreeningDtos.StudentTheoryQuestion;
import com.internflow.screening.ScreeningDtos.SubmitRequest;
import com.internflow.screening.ScreeningDtos.SubmitResponse;
import com.internflow.screening.ScreeningDtos.TestInfoResponse;
import com.internflow.screening.ScreeningDtos.TestRequest;
import com.internflow.screening.ScreeningDtos.TestResponse;
import com.internflow.screening.ScreeningDtos.TestResultsResponse;
import com.internflow.screening.ScreeningDtos.TheoryAnswerReview;
import com.internflow.screening.ScreeningDtos.TheoryAnswerSubmission;
import com.internflow.screening.ScreeningDtos.TheoryQuestionRequest;
import com.internflow.screening.ScreeningDtos.TheoryQuestionResponse;
import com.internflow.screening.ScreeningDtos.TheoryStartResponse;
import com.internflow.screening.ScreeningDtos.TheorySubmissionReview;
import com.internflow.screening.ScreeningDtos.TheorySubmitRequest;
import com.internflow.screening.ScreeningDtos.TheoryTestRequest;
import com.internflow.screening.ScreeningDtos.TheoryTestResponse;
import com.internflow.user.User;
import com.internflow.user.UserRepository;

@Service
public class ScreeningTestService {

    private static final long GRACE_SECONDS = 15;
    private static final int MAX_ROUNDS = 10;

    private final ScreeningTestRepository testRepository;
    private final TestQuestionRepository questionRepository;
    private final TheoryQuestionRepository theoryQuestionRepository;
    private final TheoryAnswerRepository theoryAnswerRepository;
    private final TestAttemptRepository attemptRepository;
    private final InternshipRepository internshipRepository;
    private final InternshipApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ScreeningTestService(ScreeningTestRepository testRepository,
            TestQuestionRepository questionRepository,
            TheoryQuestionRepository theoryQuestionRepository,
            TheoryAnswerRepository theoryAnswerRepository,
            TestAttemptRepository attemptRepository,
            InternshipRepository internshipRepository,
            InternshipApplicationRepository applicationRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.theoryQuestionRepository = theoryQuestionRepository;
        this.theoryAnswerRepository = theoryAnswerRepository;
        this.attemptRepository = attemptRepository;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ---------------------------------------------------------------- company side

    @Transactional(readOnly = true)
    public List<RoundSummary> listRounds(Long companyId, Long internshipId) {
        requireOwnInternship(companyId, internshipId);
        return testRepository.findByInternshipIdOrderByRoundNumberAsc(internshipId).stream()
                .map(t -> {
                    int count = t.isTheory()
                            ? (int) theoryQuestionRepository.countByTestId(t.getId())
                            : (int) questionRepository.countByTestId(t.getId());
                    return new RoundSummary(t.getRoundNumber(), t.getTitle(), t.getDurationMinutes(),
                            count, attemptRepository.existsByTestId(t.getId()), t.getRoundType());
                })
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

    @Transactional(readOnly = true)
    public TheoryTestResponse getTheoryForCompany(Long companyId, Long internshipId, int round) {
        requireOwnInternship(companyId, internshipId);
        ScreeningTest test = testRepository.findByInternshipIdAndRoundNumber(internshipId, round)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "There is no test for this round"));
        List<TheoryQuestion> questions = theoryQuestionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        return toTheoryTestResponse(test, questions, attemptRepository.existsByTestId(test.getId()));
    }

    @Transactional
    public TestResponse save(Long companyId, Long internshipId, int round, TestRequest request) {
        ScreeningTest test = getOrCreateTest(companyId, internshipId, round, "MCQ");
        test.setTitle(request.title().trim());
        test.setDurationMinutes(request.durationMinutes());
        test.setRoundType("MCQ");
        test = testRepository.save(test);

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
    public TheoryTestResponse saveTheory(Long companyId, Long internshipId, int round, TheoryTestRequest request) {
        ScreeningTest test = getOrCreateTest(companyId, internshipId, round, "THEORY");
        test.setTitle(request.title().trim());
        test.setDurationMinutes(request.durationMinutes());
        test.setRoundType("THEORY");
        test = testRepository.save(test);

        theoryQuestionRepository.deleteByTestId(test.getId());
        List<TheoryQuestion> created = new ArrayList<>();
        for (int i = 0; i < request.questions().size(); i++) {
            TheoryQuestionRequest q = request.questions().get(i);
            TheoryQuestion question = new TheoryQuestion();
            question.setTestId(test.getId());
            question.setSortOrder(i);
            question.setQuestionText(q.text().trim());
            question.setMaxScore(q.maxScore());
            created.add(question);
        }
        theoryQuestionRepository.saveAll(created);
        return toTheoryTestResponse(test, created, false);
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

        Map<Long, ScreeningTest> testById = tests.stream()
                .collect(Collectors.toMap(ScreeningTest::getId, Function.identity()));
        List<TestAttempt> attempts = attemptRepository.findByTestIdIn(testById.keySet());

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
            ScreeningTest t = testById.get(a.getTestId());
            AttemptState state = stateOf(a, now);
            boolean submitted = state == AttemptState.SUBMITTED;
            return new ResultResponse(a.getApplicationId(), t == null ? 1 : t.getRoundNumber(),
                    user == null ? null : user.getFullName(),
                    user == null ? null : user.getEmail(),
                    state,
                    submitted ? a.getScore() : null,
                    submitted ? a.getTotal() : null,
                    a.getSubmittedAt(),
                    t == null ? "MCQ" : t.getRoundType());
        }).toList();
        return new TestResultsResponse(true, tests.size(), results);
    }

    @Transactional(readOnly = true)
    public TheorySubmissionReview getSubmissionReview(Long companyId, Long internshipId, int round, Long applicationId) {
        requireOwnInternship(companyId, internshipId);
        ScreeningTest test = testRepository.findByInternshipIdAndRoundNumber(internshipId, round)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Test not found"));
        TestAttempt attempt = attemptRepository.findByApplicationIdAndTestId(applicationId, test.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attempt not found"));

        InternshipApplication app = applicationRepository.findById(applicationId).orElseThrow();
        User student = userRepository.findById(app.getStudentId()).orElse(null);
        String studentName = student == null ? "Student" : student.getFullName();

        List<TheoryQuestion> questions = theoryQuestionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        Map<Long, TheoryAnswer> answerMap = theoryAnswerRepository.findByAttemptId(attempt.getId()).stream()
                .collect(Collectors.toMap(TheoryAnswer::getQuestionId, Function.identity()));

        List<TheoryAnswerReview> items = questions.stream().map(q -> {
            TheoryAnswer a = answerMap.get(q.getId());
            return new TheoryAnswerReview(q.getId(), q.getQuestionText(), q.getMaxScore(),
                    a == null ? "(No answer submitted)" : a.getAnswerText(),
                    a == null ? null : a.getScore(),
                    a == null ? null : a.getFeedback());
        }).toList();

        int maxScore = questions.stream().mapToInt(TheoryQuestion::getMaxScore).sum();
        boolean graded = attempt.getScore() != null;
        return new TheorySubmissionReview(applicationId, round, studentName, items, attempt.getScore(), maxScore, graded);
    }

    @Transactional
    public TheorySubmissionReview gradeSubmission(Long companyId, Long internshipId, int round, Long applicationId,
            GradeTheoryRequest request) {
        requireOwnInternship(companyId, internshipId);
        ScreeningTest test = testRepository.findByInternshipIdAndRoundNumber(internshipId, round)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Test not found"));
        TestAttempt attempt = attemptRepository.findByApplicationIdAndTestId(applicationId, test.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attempt not found"));

        List<TheoryQuestion> questions = theoryQuestionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        Map<Long, TheoryQuestion> qMap = questions.stream()
                .collect(Collectors.toMap(TheoryQuestion::getId, Function.identity()));
        Map<Long, TheoryAnswer> answerMap = theoryAnswerRepository.findByAttemptId(attempt.getId()).stream()
                .collect(Collectors.toMap(TheoryAnswer::getQuestionId, Function.identity()));

        int totalScore = 0;
        for (GradeItemRequest g : request.grades()) {
            TheoryQuestion q = qMap.get(g.questionId());
            TheoryAnswer a = answerMap.get(g.questionId());
            if (q == null || a == null) continue;
            if (g.score() > q.getMaxScore()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Score for question cannot exceed " + q.getMaxScore());
            }
            a.setScore(g.score());
            a.setFeedback(g.feedback() == null ? null : g.feedback().trim());
            theoryAnswerRepository.save(a);
            totalScore += g.score();
        }

        int maxTotal = questions.stream().mapToInt(TheoryQuestion::getMaxScore).sum();
        attempt.setScore(totalScore);
        attempt.setTotal(maxTotal);
        attemptRepository.save(attempt);

        InternshipApplication app = applicationRepository.findById(applicationId).orElse(null);
        if (app != null) {
            notificationService.send(app.getStudentId(), "Theory Round Graded",
                    "Your Round " + round + " written answers have been graded: " + totalScore + " / " + maxTotal,
                    "/student/applications");
        }

        return getSubmissionReview(companyId, internshipId, round, applicationId);
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
        int totalRounds = testRepository.findByInternshipIdOrderByRoundNumberAsc(application.getInternshipId()).size();
        if (totalRounds == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "This internship has no test rounds yet");
        }
        if (current >= totalRounds) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This applicant is already in the last round. Create the next round first to move them further");
        }
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
            if (test.get().isTheory() && attempt.getScore() == null) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Grade round " + current + " written answers before advancing the applicant");
            }
        }

        application.setCurrentRound(current + 1);
        applicationRepository.save(application);
        notificationService.send(application.getStudentId(), "Advanced to Round " + application.getCurrentRound(),
                "You have been advanced to Round " + application.getCurrentRound() + ".",
                "/student/applications");
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
            return new TestInfoResponse(AttemptState.NO_TEST, round, totalRounds, null, null, null, null, null, "MCQ");
        }

        int questionCount = test.isTheory()
                ? (int) theoryQuestionRepository.countByTestId(test.getId())
                : (int) questionRepository.countByTestId(test.getId());

        TestAttempt attempt = attemptRepository.findByApplicationIdAndTestId(applicationId, test.getId())
                .orElse(null);
        AttemptState state = attempt == null ? AttemptState.NOT_STARTED : stateOf(attempt, Instant.now());
        boolean submitted = state == AttemptState.SUBMITTED;
        return new TestInfoResponse(state, round, totalRounds, test.getTitle(), test.getDurationMinutes(),
                questionCount, submitted ? attempt.getScore() : null, submitted ? attempt.getTotal() : null,
                test.getRoundType());
    }

    @Transactional
    public StartResponse start(Long studentId, Long applicationId) {
        TestAttempt attempt = getOrStartAttempt(studentId, applicationId, false);
        ScreeningTest test = currentTest(ownApplication(studentId, applicationId)).orElseThrow();
        List<TestQuestion> questions = questionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        List<StudentQuestion> visible = questions.stream()
                .map(q -> new StudentQuestion(q.getQuestionText(), q.options()))
                .toList();
        return new StartResponse(test.getTitle(), test.getDurationMinutes(), attempt.getDeadlineAt(), Instant.now(), visible);
    }

    @Transactional
    public TheoryStartResponse startTheory(Long studentId, Long applicationId) {
        TestAttempt attempt = getOrStartAttempt(studentId, applicationId, true);
        ScreeningTest test = currentTest(ownApplication(studentId, applicationId)).orElseThrow();
        List<TheoryQuestion> questions = theoryQuestionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        List<StudentTheoryQuestion> visible = questions.stream()
                .map(q -> new StudentTheoryQuestion(q.getId(), q.getQuestionText(), q.getMaxScore()))
                .toList();
        return new TheoryStartResponse(test.getTitle(), test.getDurationMinutes(), attempt.getDeadlineAt(), Instant.now(), visible);
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
        validateAttemptActive(attempt, now);

        List<TestQuestion> questions = questionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        List<Integer> answers = request.answers();
        int score = 0;
        for (int i = 0; i < questions.size(); i++) {
            Integer chosen = i < answers.size() ? answers.get(i) : null;
            if (chosen != null && chosen == questions.get(i).getCorrectOption()) {
                score++;
            }
        }

        attempt.setSubmittedAt(now);
        attempt.setScore(score);
        attempt.setTotal(questions.size());
        attemptRepository.save(attempt);
        return new SubmitResponse(score, questions.size());
    }

    @Transactional
    public SubmitResponse submitTheory(Long studentId, Long applicationId, TheorySubmitRequest request) {
        InternshipApplication application = ownApplication(studentId, applicationId);
        requireShortlisted(application);
        ScreeningTest test = currentTest(application)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "There is no test for your current round"));
        TestAttempt attempt = attemptRepository.findByApplicationIdAndTestId(applicationId, test.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Start the test before submitting it"));

        Instant now = Instant.now();
        validateAttemptActive(attempt, now);

        List<TheoryQuestion> questions = theoryQuestionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        Map<Long, TheoryQuestion> qMap = questions.stream()
                .collect(Collectors.toMap(TheoryQuestion::getId, Function.identity()));

        List<TheoryAnswer> answers = new ArrayList<>();
        for (TheoryAnswerSubmission sub : request.answers()) {
            if (!qMap.containsKey(sub.questionId())) continue;
            TheoryAnswer ans = new TheoryAnswer();
            ans.setAttemptId(attempt.getId());
            ans.setQuestionId(sub.questionId());
            ans.setAnswerText(sub.answerText().trim());
            answers.add(ans);
        }
        theoryAnswerRepository.saveAll(answers);

        int maxTotal = questions.stream().mapToInt(TheoryQuestion::getMaxScore).sum();
        attempt.setSubmittedAt(now);
        attempt.setScore(null);
        attempt.setTotal(maxTotal);
        attemptRepository.save(attempt);

        Internship internship = internshipRepository.findById(application.getInternshipId()).orElse(null);
        if (internship != null) {
            notificationService.send(internship.getCompanyId(), "Theory Submission",
                    "A student submitted written answers for Round " + test.getRoundNumber() + ".",
                    "/company/internships/" + internship.getId() + "/applicants");
        }
        return new SubmitResponse(null, maxTotal);
    }

    @Transactional(readOnly = true)
    public TheorySubmissionReview studentTheoryReview(Long studentId, Long applicationId) {
        InternshipApplication application = ownApplication(studentId, applicationId);
        ScreeningTest test = currentTest(application)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Test not found"));
        TestAttempt attempt = attemptRepository.findByApplicationIdAndTestId(applicationId, test.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attempt not found"));

        List<TheoryQuestion> questions = theoryQuestionRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        Map<Long, TheoryAnswer> answerMap = theoryAnswerRepository.findByAttemptId(attempt.getId()).stream()
                .collect(Collectors.toMap(TheoryAnswer::getQuestionId, Function.identity()));

        List<TheoryAnswerReview> items = questions.stream().map(q -> {
            TheoryAnswer a = answerMap.get(q.getId());
            return new TheoryAnswerReview(q.getId(), q.getQuestionText(), q.getMaxScore(),
                    a == null ? "" : a.getAnswerText(),
                    a == null ? null : a.getScore(),
                    a == null ? null : a.getFeedback());
        }).toList();

        int maxScore = questions.stream().mapToInt(TheoryQuestion::getMaxScore).sum();
        return new TheorySubmissionReview(applicationId, test.getRoundNumber(), "You", items,
                attempt.getScore(), maxScore, attempt.getScore() != null);
    }

    // ---------------------------------------------------------------- helpers

    private ScreeningTest getOrCreateTest(Long companyId, Long internshipId, int round, String expectedType) {
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
        return test;
    }

    private TestAttempt getOrStartAttempt(Long studentId, Long applicationId, boolean expectTheory) {
        InternshipApplication application = ownApplication(studentId, applicationId);
        requireShortlisted(application);
        ScreeningTest test = currentTest(application)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "There is no test for your current round"));
        if (expectTheory && !test.isTheory()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current round is an MCQ test");
        }
        if (!expectTheory && test.isTheory()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current round is a theory test");
        }

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
                throw new ApiException(HttpStatus.CONFLICT, "You have already submitted this round");
            }
            if (state == AttemptState.EXPIRED) {
                throw new ApiException(HttpStatus.CONFLICT, "The time for this round has run out");
            }
        }
        return attempt;
    }

    private void validateAttemptActive(TestAttempt attempt, Instant now) {
        AttemptState state = stateOf(attempt, now);
        if (state == AttemptState.SUBMITTED) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already submitted this test");
        }
        if (state == AttemptState.EXPIRED) {
            throw new ApiException(HttpStatus.CONFLICT, "The time for this test has run out");
        }
    }

    private void requireOwnInternship(Long companyId, Long internshipId) {
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
                locked, test.getRoundType(), items);
    }

    private TheoryTestResponse toTheoryTestResponse(ScreeningTest test, List<TheoryQuestion> questions, boolean locked) {
        List<TheoryQuestionResponse> items = questions.stream()
                .map(q -> new TheoryQuestionResponse(q.getId(), q.getSortOrder(), q.getQuestionText(), q.getMaxScore()))
                .toList();
        return new TheoryTestResponse(test.getId(), test.getRoundNumber(), test.getTitle(), test.getDurationMinutes(),
                locked, items);
    }
}
