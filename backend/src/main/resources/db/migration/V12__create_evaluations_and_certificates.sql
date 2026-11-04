CREATE TABLE evaluations (
    id             BIGSERIAL PRIMARY KEY,
    placement_id   BIGINT NOT NULL UNIQUE REFERENCES placements (id) ON DELETE CASCADE,
    mentor_id      BIGINT NOT NULL REFERENCES users (id),
    overall_rating INTEGER NOT NULL,
    strengths      VARCHAR(1000) NOT NULL,
    improvements   VARCHAR(1000),
    comments       VARCHAR(2000),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_evaluations_rating CHECK (overall_rating BETWEEN 1 AND 5)
);

CREATE TABLE certificates (
    id               BIGSERIAL PRIMARY KEY,
    placement_id     BIGINT NOT NULL UNIQUE REFERENCES placements (id),
    student_id       BIGINT NOT NULL REFERENCES users (id),
    code             VARCHAR(20) NOT NULL UNIQUE,
    student_name     VARCHAR(150) NOT NULL,
    internship_title VARCHAR(150) NOT NULL,
    company_name     VARCHAR(200) NOT NULL,
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    issued_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_certificates_student ON certificates (student_id);