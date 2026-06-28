-- OPTIONNEL — seulement si la table `certification_card` a Row Level Security activé SANS politiques,
-- ce qui bloque UPDATE/DELETE depuis l’API Supabase (client anon/authenticated) ou l’éditeur selon le rôle.
--
-- Vérifier : Table Editor → certification_card → voir si RLS est « on ».
-- Si tu te connectes en « postgres » / service role, RLS est souvent contourné : ce fichier ne change rien dans ce cas.
--
-- Décommente et exécute uniquement si tu constates des erreurs de permission.

-- ALTER TABLE public.certification_card ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "certification_card_select" ON public.certification_card
--   FOR SELECT TO authenticated, anon USING (true);

-- CREATE POLICY "certification_card_insert" ON public.certification_card
--   FOR INSERT TO authenticated, anon WITH CHECK (true);

-- CREATE POLICY "certification_card_update" ON public.certification_card
--   FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

-- CREATE POLICY "certification_card_delete" ON public.certification_card
--   FOR DELETE TO authenticated, anon USING (true);
