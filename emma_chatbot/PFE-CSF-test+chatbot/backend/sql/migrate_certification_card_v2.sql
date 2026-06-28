-- =============================================================================
-- certification_card : source de vérité pour les cartes /certifications
-- =============================================================================
-- Depuis chaque ligne ponctuelle_module on copie : image_url, title, description.
-- category = libellé de la carte thématique (formation_topic_card.titre) si liée,
--            sinon ponctuelle_formation.hero_title.
-- subtitle, skills, icon_key = NULL (à remplir à la main dans Supabase).
--
-- Exécuter UNE FOIS après déploiement du backend qui attend ces colonnes.
-- =============================================================================

BEGIN;

TRUNCATE certification_card RESTART IDENTITY;

ALTER TABLE certification_card ALTER COLUMN subtitle DROP NOT NULL;
ALTER TABLE certification_card ALTER COLUMN skills DROP NOT NULL;
ALTER TABLE certification_card ALTER COLUMN icon_key DROP NOT NULL;

ALTER TABLE certification_card ADD COLUMN IF NOT EXISTS module_id BIGINT;
ALTER TABLE certification_card ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE certification_card DROP CONSTRAINT IF EXISTS certification_card_module_id_fkey;
DROP INDEX IF EXISTS certification_card_module_id_key;
DROP INDEX IF EXISTS certification_card_module_id_idx;

ALTER TABLE certification_card
  ADD CONSTRAINT certification_card_module_id_fkey
  FOREIGN KEY (module_id) REFERENCES ponctuelle_module (id) ON DELETE CASCADE;

CREATE UNIQUE INDEX certification_card_module_id_key ON certification_card (module_id);

INSERT INTO certification_card (
  sort_order,
  category,
  title,
  subtitle,
  description,
  skills,
  icon_key,
  module_id,
  image_url
)
SELECT
  m.sort_order,
  COALESCE(
    NULLIF(TRIM(tc.titre), ''),
    NULLIF(TRIM(pf.hero_title), ''),
    'Formation'
  ),
  m.title,
  NULL,
  m.description,
  NULL,
  NULL,
  m.id,
  m.image_url
FROM ponctuelle_module m
JOIN ponctuelle_formation pf ON pf.id = m.formation_id
LEFT JOIN formation_topic_card tc
  ON tc.id = pf.topic_card_id
 AND LOWER(TRIM(tc."type")) = 'ponctuelle'
ON CONFLICT (module_id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

ALTER TABLE certification_card ALTER COLUMN module_id SET NOT NULL;
ALTER TABLE certification_card ALTER COLUMN image_url SET NOT NULL;

COMMIT;
