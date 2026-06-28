-- Active une logique DB automatique pour /certifications :
-- 1) Backfill : chaque module ponctuel existant a une ligne certification_card
-- 2) Futur : chaque INSERT/UPDATE module maintient la ligne certification_card liée
-- 3) DELETE carte manuelle -> module marqué exclude=true (la carte ne revient pas par erreur)
--
-- Script idempotent (ré-exécutable).

ALTER TABLE public.ponctuelle_module
  ADD COLUMN IF NOT EXISTS exclude_from_certifications_page boolean NOT NULL DEFAULT false;

-- Unicité logique : 1 carte max par module ponctuel.
CREATE UNIQUE INDEX IF NOT EXISTS certification_card_module_id_uidx
  ON public.certification_card (module_id)
  WHERE module_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public._cert_category_from_module(_formation_id bigint)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(TRIM(BOTH FROM COALESCE(
      NULLIF(TRIM(BOTH FROM tc_topic.ponctuelle_slug::text), ''),
      tc_topic.titre
    )), ''),
    'Autres'
  )
  FROM public.ponctuelle_formation pf
  LEFT JOIN public.formation_topic_card tc_topic ON tc_topic.id = pf.topic_card_id
  WHERE pf.id = _formation_id
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_certification_from_ponctuelle_module()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_category text;
BEGIN
  v_category := public._cert_category_from_module(NEW.formation_id);

  IF COALESCE(NEW.exclude_from_certifications_page, false) THEN
    DELETE FROM public.certification_card WHERE module_id = NEW.id;
    RETURN NEW;
  END IF;

  INSERT INTO public.certification_card (
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
  VALUES (
    NEW.sort_order,
    COALESCE(v_category, 'Autres'),
    NEW.title,
    NULL,
    NEW.description,
    NULL,
    NULL,
    NEW.is_certified,
    NEW.id,
    NEW.image_url
  )
  ON CONFLICT (module_id) DO UPDATE SET
    sort_order = EXCLUDED.sort_order,
    category = EXCLUDED.category,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    is_certified = EXCLUDED.is_certified;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ponctuelle_module_sync_certification ON public.ponctuelle_module;
DROP TRIGGER IF EXISTS trg_ponctuelle_module_cert_insert_only ON public.ponctuelle_module;
DROP TRIGGER IF EXISTS trg_ponctuelle_module_cert_exclude_only ON public.ponctuelle_module;

CREATE TRIGGER trg_ponctuelle_module_sync_certification
  AFTER INSERT OR UPDATE OF
    formation_id,
    sort_order,
    title,
    description,
    image_url,
    is_certified,
    exclude_from_certifications_page
  ON public.ponctuelle_module
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_certification_from_ponctuelle_module();

CREATE OR REPLACE FUNCTION public.trg_certification_card_deleted_set_module_excluded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.module_id IS NOT NULL THEN
    UPDATE public.ponctuelle_module
    SET exclude_from_certifications_page = true
    WHERE id = OLD.module_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_certification_card_deleted_set_module_excluded ON public.certification_card;

CREATE TRIGGER trg_certification_card_deleted_set_module_excluded
  AFTER DELETE ON public.certification_card
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_certification_card_deleted_set_module_excluded();

-- Backfill / resync complet des modules existants non exclus.
WITH src AS (
  SELECT
    m.id AS module_id,
    m.sort_order,
    COALESCE(public._cert_category_from_module(m.formation_id), 'Autres') AS category,
    m.title,
    m.description,
    m.image_url,
    m.is_certified
  FROM public.ponctuelle_module m
  WHERE COALESCE(m.exclude_from_certifications_page, false) = false
)
INSERT INTO public.certification_card (
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
  s.sort_order,
  s.category,
  s.title,
  NULL,
  s.description,
  NULL,
  NULL,
  s.is_certified,
  s.module_id,
  s.image_url
FROM src s
ON CONFLICT (module_id) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_certified = EXCLUDED.is_certified;
