CREATE TABLE tasks (
    id              BIGSERIAL PRIMARY KEY,
    placement_id    BIGINT NOT NULL REFERENCES placements (id) ON DELETE CASCADE,
    title           VARCHAR(150) NOT NULL,
    description     VARCHAR(2000) NOT NULL,
    due_date        DATE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
    submission_text VARCHAR(4000),
    submission_link VARCHAR(500),
    submitted_at    TIMESTAMPTZ,
    rating          INTEGER,
    feedback        VARCHAR(2000),
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_tasks_status CHECK (status IN ('ASSIGNED', 'SUBMITTED', 'CHANGES_REQUESTED', 'REVIEWED')),
    CONSTRAINT chk_tasks_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_tasks_placement ON tasks (placement_id, due_date);