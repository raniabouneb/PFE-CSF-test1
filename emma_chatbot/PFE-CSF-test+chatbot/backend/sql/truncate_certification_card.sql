-- Ancienne source des cartes /certifications (table plate). Le backend lit désormais
-- les modules depuis `ponctuelle_formation` / `ponctuelle_module`.
-- Exécuter une fois sur votre base si vous souhaitez supprimer les données obsolètes.

TRUNCATE TABLE certification_card RESTART IDENTITY;
