CREATE TABLE IF NOT EXISTS member_enrollment (
    id                BIGSERIAL PRIMARY KEY,
    email             TEXT NOT NULL,
    email_normalized  TEXT NOT NULL,
    user_id           TEXT REFERENCES users(id) ON DELETE SET NULL,
    enrollment_kind   TEXT NOT NULL,
    target_ref        TEXT NOT NULL,
    target_label      TEXT NOT NULL,
    enrolled_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
    status            TEXT NOT NULL DEFAULT 'active',
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE(email_normalized, enrollment_kind, target_ref)
);
CREATE INDEX IF NOT EXISTS idx_member_enrollment_email ON member_enrollment(email_normalized);
CREATE INDEX IF NOT EXISTS idx_member_enrollment_target ON member_enrollment(enrollment_kind, target_ref);
