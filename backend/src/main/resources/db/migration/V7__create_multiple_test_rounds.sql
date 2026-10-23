-- One internship can now have many tests (rounds), and one application can have an attempt per test.
-- The old single-column unique rules are looked up by type, so their auto-generated names don't matter.
DO $$
DECLARE c text;
BEGIN
    FOR c IN SELECT conname FROM pg_constraint
             WHERE conrelid = 'screening_tests'::regclass AND contype = 'u' LOOP
        EXECUTE format('ALTER TABLE screening_tests DROP CONSTRAINT %I', c);
    END LOOP;
    FOR c IN SELECT conname FROM pg_constraint
             WHERE conrelid = 'test_attempts'::regclass AND contype = 'u' LOOP
        EXECUTE format('ALTER TABLE test_attempts DROP CONSTRAINT %I', c);
    END LOOP;
END $$;

ALTER TABLE screening_tests ADD COLUMN round_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE screening_tests ADD CONSTRAINT uq_screening_tests_round UNIQUE (internship_id, round_number);
ALTER TABLE screening_tests ADD CONSTRAINT chk_screening_tests_round CHECK (round_number BETWEEN 1 AND 10);

ALTER TABLE test_attempts ADD CONSTRAINT uq_test_attempts_test_application UNIQUE (test_id, application_id);
CREATE INDEX idx_test_attempts_application ON test_attempts (application_id);

-- 0 = not in the rounds yet. Shortlisted applicants start at round 1.
ALTER TABLE applications ADD COLUMN current_round INTEGER NOT NULL DEFAULT 0;
ALTER TABLE applications ADD CONSTRAINT chk_applications_round CHECK (current_round BETWEEN 0 AND 10);
UPDATE applications SET current_round = 1 WHERE status = 'SHORTLISTED';