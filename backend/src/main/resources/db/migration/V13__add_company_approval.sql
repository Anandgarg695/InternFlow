-- Existing accounts stay approved. New company accounts are set to false by the application.
ALTER TABLE users ADD COLUMN approved BOOLEAN NOT NULL DEFAULT TRUE;