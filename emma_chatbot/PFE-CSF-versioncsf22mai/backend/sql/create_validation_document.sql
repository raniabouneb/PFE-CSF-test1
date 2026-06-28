-- Centre de Validation : documents de validation (certificats, recommandations).
-- À exécuter sur la même base que DATABASE_URL backend.

BEGIN;

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

COMMIT;
