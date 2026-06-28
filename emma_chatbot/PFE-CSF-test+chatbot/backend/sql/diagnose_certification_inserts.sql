-- À exécuter dans Supabase SQL Editor si une ligne certification_card « revient » avec un nouvel id.
-- Colle le résultat (ou une capture) pour diagnostic.

-- 1) Tous les triggers utilisateur sur public qui pourraient toucher certification_card
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  p.proname AS function_name,
  pg_get_triggerdef(t.oid) AS trigger_def
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) ILIKE '%certification_card%'
    OR c.relname = 'certification_card'
    OR c.relname = 'ponctuelle_module'
  )
ORDER BY c.relname, t.tgname;

-- 2) Fonctions public dont le corps mentionne certification_card (hors rien si liste vide)
SELECT p.proname, LEFT(p.prosrc, 2000) AS prosrc_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc ILIKE '%certification_card%'
ORDER BY p.proname;
