-- Rôles : apprenant, visiteur (interface client) | admin, assistant (interface admin)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'apprenant';

COMMENT ON COLUMN public.users.role IS 'apprenant | visiteur | admin | assistant';
