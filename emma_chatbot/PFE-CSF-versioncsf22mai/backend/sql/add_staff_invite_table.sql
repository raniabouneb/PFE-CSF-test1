CREATE TABLE IF NOT EXISTS staff_invite (
    id               BIGSERIAL PRIMARY KEY,
    email            TEXT NOT NULL UNIQUE,
    email_normalized TEXT NOT NULL UNIQUE,
    role             TEXT NOT NULL DEFAULT 'assistant',
    status           TEXT NOT NULL DEFAULT 'pending',
    user_id          TEXT REFERENCES users(id) ON DELETE SET NULL,
    invited_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);
