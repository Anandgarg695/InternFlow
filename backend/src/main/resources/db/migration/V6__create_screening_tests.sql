CREATE TABLE screening_tests (
    id               BIGSERIAL PRIMARY KEY,
    internship_id    BIGINT NOT NULL UNIQUE REFERENCES internships (id) ON DELETE CASCADE,
    title            VARCHAR(150) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_screening_tests_duration CHECK (duration_minutes BETWEEN 5 AND 180)
);

CREATE TABLE test_questions (
    id             BIGSERIAL PRIMARY KEY,
    test_id        BIGINT NOT NULL REFERENCES screening_tests (id) ON DELETE CASCADE,
    sort_order     INTEGER NOT NULL,
    question_text  VARCHAR(1000) NOT NULL,
    option_a       VARCHAR(300) NOT NULL,
    option_b       VARCHAR(300) NOT NULL,
    option_c       VARCHAR(300) NOT NULL,
    option_d       VARCHAR(300) NOT NULL,
    correct_option INTEGER NOT NULL,
    CONSTRAINT chk_test_questions_correct CHECK (correct_option BETWEEN 0 AND 3)
);

CREATE INDEX idx_test_questions_test ON test_questions (test_id, sort_order);

CREATE TABLE test_attempts (
    id             BIGSERIAL PRIMARY KEY,
    test_id        BIGINT NOT NULL REFERENCES screening_tests (id) ON DELETE CASCADE,
    application_id BIGINT NOT NULL UNIQUE REFERENCES applications (id) ON DELETE CASCADE,
    started_at     TIMESTAMPTZ NOT NULL,
    deadline_at    TIMESTAMPTZ NOT NULL,
    submitted_at   TIMESTAMPTZ,
    score          INTEGER,
    total          INTEGER
);

CREATE INDEX idx_test_attempts_test ON test_attempts (test_id);