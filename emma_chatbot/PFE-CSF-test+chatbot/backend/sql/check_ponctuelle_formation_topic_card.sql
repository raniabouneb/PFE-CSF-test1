-- À exécuter dans Supabase → SQL Editor.
-- Vérifie : chaque formation ponctuelle a un topic_card_id pointant vers formation_topic_card,
-- et le nombre de modules par formation vs lignes certification_card.

SELECT
  pf.id AS formation_id,
  pf.slug,
  pf.topic_card_id,
  ftc.titre AS topic_titre,
  ftc.ponctuelle_slug,
  (SELECT COUNT(*) FROM ponctuelle_module pm WHERE pm.formation_id = pf.id) AS modules,
  (SELECT COUNT(*) FROM certification_card cc
   JOIN ponctuelle_module m ON m.id = cc.module_id
   WHERE m.formation_id = pf.id) AS certification_rows_pour_cette_formation
FROM ponctuelle_formation pf
LEFT JOIN formation_topic_card ftc ON ftc.id = pf.topic_card_id
ORDER BY pf.id;

-- Si topic_card_id est NULL alors que modules > 0 : corriger en mettant l’id de la ligne
-- formation_topic_card (type ponctuelle) correspondant au parcours.

SELECT COUNT(*) AS total_certification_card FROM certification_card;
