-- À exécuter dans Supabase (SQL Editor) si `migrate_certification_card_v2.sql` avait mis module_id NOT NULL.
-- Permet : cartes 100 % manuelles sans module, ou délier une carte du module dans l’éditeur.
-- La contrainte UNIQUE(module_id) reste : plusieurs lignes avec module_id NULL sont autorisées (PostgreSQL).

ALTER TABLE public.certification_card
  ALTER COLUMN module_id DROP NOT NULL;
