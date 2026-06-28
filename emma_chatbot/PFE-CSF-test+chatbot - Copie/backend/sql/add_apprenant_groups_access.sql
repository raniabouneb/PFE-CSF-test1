-- Admin apprenants : groupes, membres, accès, sessions, présences, progression et certifications.
-- À exécuter sur la base PostgreSQL du projet.

BEGIN;

CREATE TABLE IF NOT EXISTS apprenant_group (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL CHECK (format IN ('reconversion', 'ponctuelle', 'sur_mesure')),
  reconversion_topic_slug TEXT,
  reconversion_pack_id BIGINT,
  ponctuelle_formation_slug TEXT,
  ponctuelle_formation_slugs JSONB,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apprenant_group_scope
  ON apprenant_group (format, reconversion_topic_slug, ponctuelle_formation_slug);

CREATE TABLE IF NOT EXISTS apprenant_group_member (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES apprenant_group(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  points_total INTEGER NOT NULL DEFAULT 0,
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_apprenant_group_member_group_email UNIQUE (group_id, email_normalized)
);

CREATE INDEX IF NOT EXISTS idx_apprenant_group_member_email ON apprenant_group_member (email_normalized);
CREATE INDEX IF NOT EXISTS idx_apprenant_group_member_user ON apprenant_group_member (user_id);

CREATE TABLE IF NOT EXISTS apprenant_group_access (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES apprenant_group(id) ON DELETE CASCADE,
  access_kind TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_apprenant_group_access_target UNIQUE (group_id, access_kind, target_ref)
);

CREATE INDEX IF NOT EXISTS idx_apprenant_group_access_group ON apprenant_group_access (group_id);

CREATE TABLE IF NOT EXISTS group_session (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT NOT NULL REFERENCES apprenant_group(id) ON DELETE CASCADE,
  access_id BIGINT REFERENCES apprenant_group_access(id) ON DELETE SET NULL,
  target_ref TEXT,
  target_kind TEXT,
  target_label TEXT,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_session_group_date ON group_session (group_id, scheduled_at DESC);

CREATE TABLE IF NOT EXISTS session_attendance (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES group_session(id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES apprenant_group_member(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'present',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_session_attendance_member UNIQUE (session_id, member_id)
);

CREATE TABLE IF NOT EXISTS learner_progress (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES apprenant_group_member(id) ON DELETE CASCADE,
  access_kind TEXT NOT NULL,
  target_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started',
  score_percent INTEGER,
  current_flag BOOLEAN NOT NULL DEFAULT FALSE,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  opened_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  completed_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  progress_mode TEXT NOT NULL DEFAULT 'manual',
  minutes_completed INTEGER NOT NULL DEFAULT 0,
  minutes_total INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_learner_progress_target UNIQUE (member_id, target_ref)
);

CREATE INDEX IF NOT EXISTS idx_learner_progress_member_current ON learner_progress (member_id, current_flag);

CREATE TABLE IF NOT EXISTS learner_certification_result (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES apprenant_group_member(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scope_ref TEXT,
  score_percent INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  issuer TEXT,
  awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learner_certification_scope ON learner_certification_result (scope_ref);

CREATE TABLE IF NOT EXISTS apprenant_member_note (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES apprenant_group_member(id) ON DELETE CASCADE,
  author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'info',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_planning_reminder_rule (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  hours_before INTEGER NOT NULL DEFAULT 24,
  channel_email BOOLEAN NOT NULL DEFAULT TRUE,
  channel_sms BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE apprenant_group ADD COLUMN IF NOT EXISTS ponctuelle_formation_slugs JSONB;
ALTER TABLE apprenant_group ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE group_session ADD COLUMN IF NOT EXISTS access_id BIGINT REFERENCES apprenant_group_access(id) ON DELETE SET NULL;
ALTER TABLE group_session ADD COLUMN IF NOT EXISTS target_ref TEXT;
ALTER TABLE group_session ADD COLUMN IF NOT EXISTS target_kind TEXT;
ALTER TABLE group_session ADD COLUMN IF NOT EXISTS target_label TEXT;

ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS opened_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS completed_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS progress_mode TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS minutes_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS minutes_total INTEGER;

COMMIT;
