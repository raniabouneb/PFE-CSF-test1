-- =============================================================================
-- ÉTAT FINAL : aucune insertion automatique depuis ponctuelle_module.
-- Symptôme typique : après DELETE dans certification_card, une NOUVELLE ligne réapparaît
-- avec un autre id — c’est un INSERT (souvent trigger AFTER UPDATE sur ponctuelle_module).
--
-- On supprime tous les triggers utilisateur sur public.ponctuelle_module (pas seulement
-- les noms connus : un vieux trigger renommé ou une migration partielle suffisait à recréer la carte).
--
-- On garde UN SEUL trigger : après DELETE sur certification_card → exclude = true sur le module.
--
-- Nouvelles cartes / backfill : uniquement via script backend avec CSF_ALLOW_CERTIFICATION_SYNC=1
-- (python -m scripts.run_sync_and_summary).
-- =============================================================================

-- Supprime tous les triggers non-système sur ponctuelle_module (cert + tout autre nom legacy).
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'ponctuelle_module'
      AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.ponctuelle_module', r.tgname);
  END LOOP;
END $$;

-- Redondant si le bloc ci-dessus a tout enlevé (gardé pour idempotence / vieux scripts)
DROP TRIGGER IF EXISTS trg_ponctuelle_module_sync_certification ON public.ponctuelle_module;
DROP TRIGGER IF EXISTS trg_ponctuelle_module_cert_insert_only ON public.ponctuelle_module;
DROP TRIGGER IF EXISTS trg_ponctuelle_module_cert_exclude_only ON public.ponctuelle_module;

-- Tout trigger (sur n’importe quelle table public) dont la fonction insère / met à jour
-- certification_card — couvre un trigger renommé ou posé sur une autre table (ex. migration atypique).
-- Exclut la future fonction « après DELETE » : elle ne contient pas certification_card dans son corps.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS sch, c.relname AS tbl, t.tgname AS tgn, p.proname AS pfn
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE n.nspname = 'public'
      AND NOT t.tgisinternal
      AND p.proname IS DISTINCT FROM 'trg_certification_card_deleted_set_module_excluded'
      AND pg_get_functiondef(p.oid) ~* 'certification_card'
      AND pg_get_functiondef(p.oid) ~* 'INSERT|UPDATE|DELETE'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', r.tgn, r.sch, r.tbl);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.trg_sync_certification_from_ponctuelle_module() CASCADE;
DROP FUNCTION IF EXISTS public.trg_ponctuelle_module_cert_insert_only() CASCADE;
DROP FUNCTION IF EXISTS public.trg_ponctuelle_module_cert_exclude_only() CASCADE;
DROP FUNCTION IF EXISTS public.trg_sync_certification_from_ponctuelle_module CASCADE;

ALTER TABLE public.ponctuelle_module
  ADD COLUMN IF NOT EXISTS exclude_from_certifications_page boolean NOT NULL DEFAULT false;

-- Fonction exécutée avec les droits du propriétaire (contourne RLS si elle bloquait l’UPDATE du module).
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

COMMENT ON FUNCTION public.trg_certification_card_deleted_set_module_excluded() IS
  'Après suppression manuelle d’une certification_card : module marqué exclu (pas de recréation par sync tant que exclude=true).';
