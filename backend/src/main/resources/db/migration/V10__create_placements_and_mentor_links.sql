-- A company's mentor team: the company invites, the mentor accepts or declines
CREATE TABLE mentor_links (
    id         BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    mentor_id  BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status     VARCHAR(15) NOT NULL DEFAULT 'INVITED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_mentor_links UNIQUE (company_id, mentor_id),
    CONSTRAINT chk_mentor_links_status CHECK (status IN ('INVITED', 'ACTIVE', 'DECLINED', 'REMOVED')),
    CONSTRAINT chk_mentor_links_distinct CHECK (company_id <> mentor_id)
);

CREATE INDEX idx_mentor_links_mentor ON mentor_links (mentor_id);

-- One placement per accepted offer
CREATE TABLE placements (
    id             BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE REFERENCES applications (id) ON DELETE CASCADE,
    internship_id  BIGINT NOT NULL REFERENCES internships (id),
    student_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    mentor_id      BIGINT REFERENCES users (id) ON DELETE SET NULL,
    start_date     DATE NOT NULL,
    end_date       DATE NOT NULL,
    status         VARCHAR(15) NOT NULL DEFAULT 'ACTIVE',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_placements_status CHECK (status IN ('ACTIVE', 'COMPLETED', 'TERMINATED')),
    CONSTRAINT chk_placements_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_placements_internship ON placements (internship_id);
CREATE INDEX idx_placements_student ON placements (student_id);
CREATE INDEX idx_placements_mentor ON placements (mentor_id);

-- Offers that were already accepted before this step get their placement now
INSERT INTO placements (application_id, internship_id, student_id, start_date, end_date)
SELECT o.application_id, o.internship_id, o.student_id, o.start_date, o.start_date + (i.duration_weeks * 7)
FROM offers o
JOIN internships i ON i.id = o.internship_id
WHERE o.status = 'ACCEPTED';