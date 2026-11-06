ALTER TABLE screening_tests ADD COLUMN round_type VARCHAR(20) NOT NULL DEFAULT 'MCQ';
ALTER TABLE screening_tests ADD CONSTRAINT chk_screening_tests_type CHECK (round_type IN ('MCQ', 'THEORY'));

CREATE TABLE theory_questions (
    id            BIGSERIAL PRIMARY KEY,
    test_id       BIGINT NOT NULL REFERENCES screening_tests (id) ON DELETE CASCADE,
    sort_order    INTEGER NOT NULL,
    question_text VARCHAR(2000) NOT NULL,
    max_score     INTEGER NOT NULL DEFAULT 10,
    CONSTRAINT chk_theory_questions_max_score CHECK (max_score BETWEEN 1 AND 100)
);

CREATE INDEX idx_theory_questions_test ON theory_questions (test_id, sort_order);

CREATE TABLE theory_answers (
    id          BIGSERIAL PRIMARY KEY,
    attempt_id  BIGINT NOT NULL REFERENCES test_attempts (id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES theory_questions (id) ON DELETE CASCADE,
    answer_text VARCHAR(4000) NOT NULL,
    score       INTEGER,
    feedback    VARCHAR(1000),
    CONSTRAINT uq_theory_answers_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_theory_answers_attempt ON theory_answers (attempt_id);
