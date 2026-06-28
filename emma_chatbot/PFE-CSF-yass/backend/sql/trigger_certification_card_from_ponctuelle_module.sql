-- OBSOLÈTE pour les déploiements récents : utiliser `add_exclude_from_certifications_page.sql`
-- (exclusion après suppression manuelle de carte + même logique trigger).
--
-- À exécuter une fois dans Supabase (SQL Editor) après UNIQUE(module_id) sur certification_card.
-- Chaque INSERT / UPDATE sur ponctuelle_module met à jour certification_card (titre, description, image_url, category, …).
-- Les suppressions de module suppriment la carte si FK ON DELETE CASCADE est en place.

CREATE OR REPLACE FUNCTION public.trg_sync_certification_from_ponctuelle_module()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
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
  LEFT JOIN formation_topic_card tc_topic ON tc_topic.id = pf.topic_card_id
  WHERE m.id = NEW.id
  ON CONFLICT (module_id) DO UPDATE SET
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_certified = EXCLUDED.is_certified;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ponctuelle_module_sync_certification ON public.ponctuelle_module;

CREATE TRIGGER trg_ponctuelle_module_sync_certification
  AFTER INSERT OR UPDATE OF
    formation_id,
    sort_order,
    title,
    description,
    image_url,
    is_certified
  ON public.ponctuelle_module
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_certification_from_ponctuelle_module();
