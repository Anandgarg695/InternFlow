CREATE TABLE applications (
    id            BIGSERIAL PRIMARY KEY,
    internship_id BIGINT NOT NULL REFERENCES internships (id),
    student_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    cover_note    VARCHAR(2000),
    status        VARCHAR(20) NOT NULL DEFAULT 'APPLIED',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_applications_internship_student UNIQUE (internship_id, student_id),
    CONSTRAINT chk_applications_status CHECK (status IN ('APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN'))
);

CREATE INDEX idx_applications_student ON applications (student_id);
CREATE INDEX idx_applications_internship ON applications (internship_id);