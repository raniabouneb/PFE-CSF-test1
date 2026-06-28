-- Centre de Validation : toutes les tables requises.
-- À exécuter sur la même base que DATABASE_URL backend.

BEGIN;

-- 1. Table des scores de test par module
CREATE TABLE IF NOT EXISTS module_test_score (
  id                BIGSERIAL   PRIMARY KEY,
  member_id         BIGINT      NOT NULL REFERENCES apprenant_group_member(id) ON DELETE CASCADE,
  module_ref        TEXT        NOT NULL,
  score_percent     INTEGER     NOT NULL,
  passed            BOOLEAN,
  source            TEXT        NOT NULL DEFAULT 'lms',
  external_ref      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, module_ref)
);

CREATE INDEX IF NOT EXISTS idx_module_test_score_member
  ON module_test_score (member_id);

CREATE INDEX IF NOT EXISTS idx_module_test_score_module_ref
  ON module_test_score (module_ref);

-- 2. Table des documents de validation (certificats, recommandations)
CREATE TABLE IF NOT EXISTS validation_document (
  id                BIGSERIAL   PRIMARY KEY,
  member_id         BIGINT      NOT NULL REFERENCES apprenant_group_member(id) ON DELETE CASCADE,
  kind              TEXT        NOT NULL CHECK (kind IN ('certificate', 'recommendation')),
  scope_ref         TEXT        NOT NULL,
  scope_label       TEXT        NOT NULL,
  presence_percent  INTEGER     NOT NULL,
  absence_count     INTEGER     NOT NULL DEFAULT 0,
  absence_sessions  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  test_score_percent INTEGER,
  system_result     TEXT        NOT NULL CHECK (system_result IN ('success', 'failure')),
  system_reason     TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending_admin'
                    CHECK (status IN ('pending_admin', 'validated', 'rejected')),
  rejection_reason  TEXT,
  reviewed_by_user_id TEXT      REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  pdf_path          TEXT,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_validation_document_member
  ON validation_document (member_id);

CREATE INDEX IF NOT EXISTS idx_validation_document_status
  ON validation_document (status);

CREATE INDEX IF NOT EXISTS idx_validation_document_scope_ref
  ON validation_document (scope_ref);

-- 3. Table des notifications apprenant
CREATE TABLE IF NOT EXISTS learner_notification (
  id                BIGSERIAL   PRIMARY KEY,
  user_id           TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind              TEXT        NOT NULL,
  title             TEXT        NOT NULL,
  body              TEXT,
  link_ref          TEXT,
  is_read           BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ,
  CONSTRAINT learner_notification_kind_check CHECK (
    kind = ANY (
      ARRAY[
        'doc_validated'::text,
        'doc_rejected'::text,
        'cert_available'::text,
        'session_scheduled'::text
      ]
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_learner_notification_user_read
  ON learner_notification (user_id, is_read);

COMMIT;
