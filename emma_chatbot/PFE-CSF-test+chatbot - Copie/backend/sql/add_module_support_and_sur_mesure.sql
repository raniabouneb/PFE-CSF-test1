-- Admin catalogue : supports PDF polymorphes + modules « sur mesure » (hors tables reconversion/ponctuelle).
-- À exécuter sur la base PostgreSQL du projet (même procédure que les autres scripts dans backend/sql/).

BEGIN;

CREATE TABLE IF NOT EXISTS sur_mesure_module (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_hours INTEGER NOT NULL DEFAULT 24,
  labs_count INTEGER NOT NULL DEFAULT 0,
  has_exam BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sur_mesure_module_sort ON sur_mesure_module (sort_order, id);

CREATE TABLE IF NOT EXISTS module_support (
  id BIGSERIAL PRIMARY KEY,
  module_source TEXT NOT NULL CHECK (
    module_source IN (
      'reconversion_pack_module',
      'ponctuelle_module',
      'sur_mesure_module'
    )
  ),
  module_id BIGINT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_module_support_lookup ON module_support (module_source, module_id);
CREATE INDEX IF NOT EXISTS idx_module_support_created ON module_support (created_at DESC);

COMMIT;
