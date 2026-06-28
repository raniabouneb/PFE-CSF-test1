-- Cartes certifications : lecture sans jointure, catégories = libellés filtres UI, module_id optionnel.
-- Exécuter après déploiement backend qui expose is_certified et module_id nullable.

BEGIN;

ALTER TABLE certification_card
  ADD COLUMN IF NOT EXISTS is_certified BOOLEAN NOT NULL DEFAULT true;

UPDATE certification_card SET is_certified = true WHERE is_certified IS NULL;

ALTER TABLE certification_card
  ALTER COLUMN module_id DROP NOT NULL;

COMMIT;
