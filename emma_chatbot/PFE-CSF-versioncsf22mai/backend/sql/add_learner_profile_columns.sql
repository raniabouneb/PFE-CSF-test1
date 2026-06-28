-- Profil apprenant (CSF) — exécuter une fois sur la base Supabase / Postgres utilisée par le backend.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name VARCHAR(120);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name VARCHAR(120);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS learner_cv JSONB;
