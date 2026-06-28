-- Purge conversations invité expirées + fichiers expirés.
-- À planifier (cron / pg_cron) toutes les 30-60 minutes.

DELETE FROM public.ai_conversation_file
WHERE expires_at IS NOT NULL
  AND expires_at < now();

DELETE FROM public.ai_conversation
WHERE is_temporary = true
  AND expires_at IS NOT NULL
  AND expires_at < now();
