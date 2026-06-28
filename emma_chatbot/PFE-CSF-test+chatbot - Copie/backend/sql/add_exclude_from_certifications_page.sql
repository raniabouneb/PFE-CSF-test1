-- À exécuter une fois dans Supabase (SQL Editor).
--
-- Règles :
-- - Nouveau module → une ligne certification_card est créée (copie initiale).
-- - Ensuite la table certification_card est libre : édition / suppression manuelle ne sont pas
--   écrasées par les mises à jour du module ni par le refresh de la page API.
-- - Si tu supprimes une carte liée à un module, le module passe en « exclu » : la ligne ne revient pas.
-- - Pour réafficher une carte : ponctuelle_module.exclude_from_certifications_page = false (puis éventuellement
--   un UPDATE sur le module pour déclencher la restauration si besoin).

ALTER TABLE public.ponctuelle_module
  ADD COLUMN IF NOT EXISTS exclude_from_certifications_page boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ponctuelle_module.exclude_from_certifications_page IS
  'Si true : pas de carte /certifications pour ce module. '
  'Mis à true quand la ligne certification_card avec ce module_id est supprimée.';

-- Suppression manuelle d’une carte → ne plus recréer automatiquement.
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

-- INSERT module → créer la carte une fois. UPDATE module → ne rien écraser sur certification_card,
-- sauf si exclude_from_certifications_page change (retirer / restaurer la carte).
CREATE OR REPLACE FUNCTION public.trg_sync_certification_from_ponctuelle_module()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
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
  END IF;

  IF TG_OP = 'UPDATE' THEN
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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ponctuelle_module_sync_certification ON public.ponctuelle_module;

CREATE TRIGGER trg_ponctuelle_module_sync_certification
  AFTER INSERT OR UPDATE ON public.ponctuelle_module
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_certification_from_ponctuelle_module();
