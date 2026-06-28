-- Recherche floue des modules (`ponctuelle_module`) : opérateur pg_trgm `%` + `immutable_unaccent`
-- sur le titre du module et le terme de recherche (accents + fautes légères selon `pg_trgm.similarity_threshold`).
-- À exécuter une fois sur PostgreSQL / Supabase après `enable_unaccent.sql`.

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- Enveloppe IMMUTABLE autour de `unaccent(text)` pour l’utiliser dans des expressions indexables / trigram.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $func$
  SELECT public.unaccent(input);
$func$;

COMMENT ON FUNCTION public.immutable_unaccent(text) IS
  'unaccent pour recherche modules avec pg_trgm (immutable_unaccent(lower(...)) % immutable_unaccent(lower(...)))';
