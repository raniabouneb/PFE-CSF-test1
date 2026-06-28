-- Recherche insensible aux accents (`GET /api/v1/formation/search`) : requis pour matcher
-- « systeme » avec « système » en base. À exécuter une fois sur PostgreSQL / Supabase (SQL editor).

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Recherche floue modules (trigram + unaccent) : voir `enable_pg_trgm_immutable_unaccent.sql`.
