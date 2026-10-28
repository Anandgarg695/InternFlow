-- Two new application statuses: OFFERED (offer pending) and SELECTED (offer accepted)
ALTER TABLE applications DROP CONSTRAINT chk_applications_status;
ALTER TABLE applications ADD CONSTRAINT chk_applications_status
    CHECK (status IN ('APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN', 'OFFERED', 'SELECTED'));

CREATE TABLE offers (
    id                BIGSERIAL PRIMARY KEY,
    application_id    BIGINT NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    internship_id     BIGINT NOT NULL REFERENCES internships (id),
    student_id        BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    stipend_per_month INTEGER NOT NULL,
    start_date        DATE NOT NULL,
    expires_on        DATE NOT NULL,
    message           VARCHAR(1000),
    status            VARCHAR(15) NOT NULL DEFAULT 'OFFERED',
    responded_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_offers_status CHECK (status IN ('OFFERED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED')),
    CONSTRAINT chk_offers_stipend CHECK (stipend_per_month >= 0),
    CONSTRAINT chk_offers_dates CHECK (start_date > expires_on)
);

CREATE INDEX idx_offers_internship ON offers (internship_id);
CREATE INDEX idx_offers_student ON offers (student_id);
CREATE INDEX idx_offers_status_expiry ON offers (status, expires_on);

-- The database itself allows only one live offer per application
CREATE UNIQUE INDEX uq_offers_one_active ON offers (application_id)
    WHERE status IN ('OFFERED', 'ACCEPTED');