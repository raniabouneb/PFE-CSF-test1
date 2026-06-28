-- Sync : une ligne certification_card par ponctuelle_module (hors modules exclude_from_certifications_page).
-- category = COALESCE(trim(ponctuelle_slug), titre) sur formation_topic_card liée par topic_card_id, sinon « Autres ».
-- Prérequis : UNIQUE(module_id), colonnes image_url, is_certified, exclude_from_certifications_page sur ponctuelle_module.
-- Voir add_exclude_from_certifications_page.sql pour le schéma complet.
-- Pas de DELETE automatique ici (aligné sur certification_card_sync.py).

INSERT INTO certification_card (
  sort_order,
  category,
  title,
  subtitle,
  description,
  skills,
  icon_key,
  is_certified,
  module_id,
  image_url
)
SELECT
  m.sort_order,
  COALESCE(
    NULLIF(TRIM(BOTH FROM COALESCE(
      NULLIF(TRIM(BOTH FROM tc_topic.ponctuelle_slug::text), ''),
      tc_topic.titre
    )), ''),
    'Autres'
  ),
  m.title,
  NULL,
  m.description,
  NULL,
  NULL,
  m.is_certified,
  m.id,
  m.image_url
FROM ponctuelle_module m
JOIN ponctuelle_formation pf ON pf.id = m.formation_id
LEFT JOIN formation_topic_card tc_topic
  ON tc_topic.id = pf.topic_card_id
WHERE COALESCE(m.exclude_from_certifications_page, false) = false
  AND NOT EXISTS (SELECT 1 FROM certification_card c WHERE c.module_id = m.id)
ON CONFLICT (module_id) DO NOTHING;
