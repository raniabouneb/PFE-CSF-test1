-- À exécuter une fois sur Supabase / Postgres (schéma public) utilisé par DATABASE_URL du backend.
-- Corrige : column users.first_name does not exist (auth /login, /auth/me, profil).

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name VARCHAR(120);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name VARCHAR(120);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS learner_cv JSONB;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'apprenant';

COMMENT ON COLUMN public.users.role IS 'apprenant | visiteur | admin | assistant';
