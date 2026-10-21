CREATE TABLE company_profiles (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    company_name  VARCHAR(200),
    industry      VARCHAR(100),
    company_size  VARCHAR(20),
    website       VARCHAR(255),
    location      VARCHAR(150),
    contact_phone VARCHAR(20),
    linkedin_url  VARCHAR(255),
    description   VARCHAR(2000),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);