CREATE TABLE interviews (
    id                BIGSERIAL PRIMARY KEY,
    application_id    BIGINT NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    student_id        BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    round_number      INTEGER NOT NULL,
    interview_type    VARCHAR(20) NOT NULL,
    mode              VARCHAR(10) NOT NULL,
    scheduled_at      TIMESTAMPTZ NOT NULL,
    duration_minutes  INTEGER NOT NULL,
    meeting_link      VARCHAR(500),
    location          VARCHAR(200),
    notes             VARCHAR(1000),
    status            VARCHAR(25) NOT NULL DEFAULT 'SCHEDULED',
    reschedule_reason VARCHAR(500),
    outcome           VARCHAR(10),
    feedback          VARCHAR(1000),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_interviews_type CHECK (interview_type IN ('TECHNICAL', 'HR', 'MANAGERIAL', 'PANEL')),
    CONSTRAINT chk_interviews_mode CHECK (mode IN ('ONLINE', 'ONSITE')),
    CONSTRAINT chk_interviews_status CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_interviews_outcome CHECK (outcome IS NULL OR outcome IN ('PASSED', 'FAILED')),
    CONSTRAINT chk_interviews_duration CHECK (duration_minutes BETWEEN 15 AND 180)
);

CREATE INDEX idx_interviews_application ON interviews (application_id);
CREATE INDEX idx_interviews_student ON interviews (student_id, scheduled_at);

-- The database itself allows only one active interview per application
CREATE UNIQUE INDEX uq_interviews_one_active ON interviews (application_id)
    WHERE status IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED');