CREATE TABLE student_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    phone           VARCHAR(20),
    university      VARCHAR(200),
    degree          VARCHAR(150),
    branch          VARCHAR(150),
    graduation_year INTEGER,
    cgpa            NUMERIC(4, 2),
    skills          VARCHAR(1000),
    bio             VARCHAR(2000),
    linkedin_url    VARCHAR(255),
    github_url      VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);