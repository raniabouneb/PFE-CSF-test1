-- Remplace d’anciens libellés (topic_card / hero) par les libellés filtres canoniques.
UPDATE certification_card
SET category = 'Full-Stack'
WHERE TRIM(category) IN ('Bâtissez le Web de demain', 'Batissez le Web de demain');
