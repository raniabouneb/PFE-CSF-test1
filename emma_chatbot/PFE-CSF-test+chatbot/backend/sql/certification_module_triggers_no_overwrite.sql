-- À exécuter dans Supabase (SQL Editor) si les lignes certification_card sont encore
-- réécrites quand tu modifies ponctuelle_module (titre, description, image, etc.).
--
-- Effet : les triggers sur ponctuelle_module ne touchent certification_card que pour :
--   1) INSERT d’un nouveau module → une ligne certification_card (copie initiale)
--   2) Changement de exclude_from_certifications_page → retirer / recréer la carte liée
--
-- Les UPDATE « normaux » sur le module (sans changer exclude_…) ne modifient plus certification_card.
--
-- Prérequis : colonne ponctuelle_module.exclude_from_certifications_page (voir add_exclude_from_certifications_page.sql).

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

DROP TRIGGER IF EXISTS trg_ponctuelle_module_sync_certification ON public.ponctuelle_module;

CREATE TRIGGER trg_ponctuelle_module_cert_insert_only
  AFTER INSERT ON public.ponctuelle_module
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ponctuelle_module_cert_insert_only();

CREATE TRIGGER trg_ponctuelle_module_cert_exclude_only
  AFTER UPDATE OF exclude_from_certifications_page ON public.ponctuelle_module
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ponctuelle_module_cert_exclude_only();

-- (Les triggers DELETE sur certification_card → exclude, et fonctions associées,
-- restent ceux de add_exclude_from_certifications_page.sql — ne pas les retirer.)
