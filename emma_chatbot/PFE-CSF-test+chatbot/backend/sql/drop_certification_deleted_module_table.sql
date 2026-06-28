-- Supprime la table technique certification_card_deleted_module et restaure les triggers
-- sans cette table. La logique repose uniquement sur :
--   ponctuelle_module.exclude_from_certifications_page
--   + trigger AFTER DELETE sur certification_card (met exclude = true)
--   + sync Python désactivé par défaut (CSF_ALLOW_CERTIFICATION_SYNC)
--
-- À exécuter dans Supabase SQL Editor (remplace l’ancienne migration avec table supprimée).

-- 1) Fonctions sans dépendance à certification_card_deleted_module
CREATE OR REPLACE FUNCTION public.trg_certification_card_deleted_set_module_excluded()
RETURNS trigger
LANGUAGE plpgsql
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

CREATE OR REPLACE FUNCTION public.trg_ponctuelle_module_cert_insert_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(NEW.exclude_from_certifications_page, false) THEN
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
  FROM public.ponctuelle_module m
  JOIN public.ponctuelle_formation pf ON pf.id = m.formation_id
  LEFT JOIN public.formation_topic_card tc_topic ON tc_topic.id = pf.topic_card_id
  WHERE m.id = NEW.id
  ON CONFLICT (module_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_ponctuelle_module_cert_exclude_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.exclude_from_certifications_page IS DISTINCT FROM NEW.exclude_from_certifications_page THEN
    IF COALESCE(NEW.exclude_from_certifications_page, false) THEN
      DELETE FROM public.certification_card WHERE module_id = NEW.id;
    ELSE
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
      FROM public.ponctuelle_module m
      JOIN public.ponctuelle_formation pf ON pf.id = m.formation_id
      LEFT JOIN public.formation_topic_card tc_topic ON tc_topic.id = pf.topic_card_id
      WHERE m.id = NEW.id
        AND NOT EXISTS (SELECT 1 FROM public.certification_card c WHERE c.module_id = NEW.id)
      ON CONFLICT (module_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ponctuelle_module_cert_insert_only ON public.ponctuelle_module;
DROP TRIGGER IF EXISTS trg_ponctuelle_module_cert_exclude_only ON public.ponctuelle_module;

CREATE TRIGGER trg_ponctuelle_module_cert_insert_only
  AFTER INSERT ON public.ponctuelle_module
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ponctuelle_module_cert_insert_only();

CREATE TRIGGER trg_ponctuelle_module_cert_exclude_only
  AFTER UPDATE OF exclude_from_certifications_page ON public.ponctuelle_module
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ponctuelle_module_cert_exclude_only();

-- 2) Table optionnelle créée par l’ancienne migration
DROP TABLE IF EXISTS public.certification_card_deleted_module CASCADE;
