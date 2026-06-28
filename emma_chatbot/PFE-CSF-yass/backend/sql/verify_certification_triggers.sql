-- À exécuter dans Supabase SQL Editor : liste les triggers sur certification_card et ponctuelle_module.
--
-- Attendu après certification_triggers_minimal.sql :
--   trg_certification_card_deleted_set_module_excluded ON certification_card (AFTER DELETE)
--   aucun trigger sur ponctuelle_module (sinon une carte supprimée peut être recréée au prochain UPDATE module)

SELECT
  t.tgname AS trigger_name,
  c.relname AS table_name,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE NOT t.tgisinternal
  AND c.relname IN ('certification_card', 'ponctuelle_module')
ORDER BY c.relname, t.tgname;
