CREATE TABLE internships (
    id                   BIGSERIAL PRIMARY KEY,
    company_id           BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title                VARCHAR(150) NOT NULL,
    description          VARCHAR(5000) NOT NULL,
    skills_required      VARCHAR(1000) NOT NULL,
    location             VARCHAR(150),
    work_mode            VARCHAR(20) NOT NULL,
    duration_weeks       INTEGER NOT NULL,
    stipend_per_month    INTEGER NOT NULL DEFAULT 0,
    openings             INTEGER NOT NULL DEFAULT 1,
    application_deadline DATE NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_internships_status CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED')),
    CONSTRAINT chk_internships_work_mode CHECK (work_mode IN ('REMOTE', 'ONSITE', 'HYBRID')),
    CONSTRAINT chk_internships_duration CHECK (duration_weeks BETWEEN 1 AND 52),
    CONSTRAINT chk_internships_stipend CHECK (stipend_per_month >= 0),
    CONSTRAINT chk_internships_openings CHECK (openings >= 1)
);

CREATE INDEX idx_internships_company ON internships (company_id);
CREATE INDEX idx_internships_status_deadline ON internships (status, application_deadline);