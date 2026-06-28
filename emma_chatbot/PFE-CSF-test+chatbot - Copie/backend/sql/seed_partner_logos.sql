-- Logos partenaires (chaîne roulante page d’accueil) : table `partner_logos` lue par
-- GET /api/v1/home/partners-data → champ JSON `partners[].logo` (= logo_path).
-- Exécuter une fois sur la même base que `DATABASE_URL` du backend (ex. Supabase SQL editor).

CREATE TABLE IF NOT EXISTS public.partner_logos (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.partner_logos (id, name, logo_path, is_active, sort_order) VALUES
  (1, 'TELNET', '/partner-logos/telnet.png', true, 10),
  (2, 'Sofiatech', '/partner-logos/sofiatech.png', true, 20),
  (3, 'Sofrecom', '/partner-logos/sofrecom.png', true, 30),
  (4, 'FOCUS', '/partner-logos/focus.png', true, 40),
  (5, 'Faurecia', '/partner-logos/faurecia.png', true, 50),
  (6, 'Altran', '/partner-logos/altran.png', true, 60),
  (7, 'FST', '/partner-logos/fst.png', true, 70)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  logo_path = EXCLUDED.logo_path,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

SELECT setval(
  pg_get_serial_sequence('public.partner_logos', 'id'),
  COALESCE((SELECT MAX(id) FROM public.partner_logos), 1)
);
