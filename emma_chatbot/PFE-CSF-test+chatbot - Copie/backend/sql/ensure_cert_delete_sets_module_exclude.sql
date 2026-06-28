-- OBLIGATOIRE pour que la suppression d’une ligne certification_card « tienne » :
-- sans ce trigger, exclude_from_certifications_page reste false sur le module et tout INSERT
-- de backfill (script sync) peut recréer la carte.
--
-- À exécuter dans Supabase SQL Editor (une fois, idempotent).

ALTER TABLE public.ponctuelle_module
  ADD COLUMN IF NOT EXISTS exclude_from_certifications_page boolean NOT NULL DEFAULT false;

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
