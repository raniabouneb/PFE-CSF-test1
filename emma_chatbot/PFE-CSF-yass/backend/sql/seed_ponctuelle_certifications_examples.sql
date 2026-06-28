-- Exemples pour tester la page /certifications (sections = formations ponctuelles, cartes = modules).
-- Idempotent :
--   - UPSERT des lignes `ponctuelle_formation` + liaison `formation_topic_card.ponctuelle_slug`
--   - INSERT de modules **uniquement** si la formation n’a encore **aucun** module (ne supprime rien).
--
-- Exécution : Supabase → SQL Editor, ou : psql "$DATABASE_URL" -f backend/sql/seed_ponctuelle_certifications_examples.sql

-- Hero page certifications (une ligne si la table est vide)
INSERT INTO certifications_hero (title, subtitle, background_image, stats)
SELECT
  'Certifications',
  'Professionnelles',
  '/images/certif.jpg',
  '[
    {"value": "25+", "label": "Certifications"},
    {"value": "4 800+", "label": "Certifiés"},
    {"value": "96%", "label": "Taux de Réussite"},
    {"value": "48h", "label": "Support Réactif"}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM certifications_hero LIMIT 1);

DO $$
DECLARE
  tc_se BIGINT;
  tc_fs BIGINT;
  tc_tl BIGINT;
  tc_da BIGINT;
  tc_lg BIGINT;
  tc_ss BIGINT;
  fid BIGINT;
  n   INT;
BEGIN
  -- Cartes thématiques « ponctuelle » (colonne type = formation_type côté ORM)
  SELECT id INTO tc_se FROM formation_topic_card
    WHERE LOWER(TRIM("type")) = 'ponctuelle'
      AND (titre ILIKE '%Embarqu%' OR titre ILIKE '%Système%' OR titre ILIKE '%systeme%')
    ORDER BY id LIMIT 1;

  SELECT id INTO tc_fs FROM formation_topic_card
    WHERE LOWER(TRIM("type")) = 'ponctuelle'
      AND (titre ILIKE '%full%' OR titre ILIKE '%stack%' OR titre ILIKE '%Full-Stack%')
    ORDER BY id LIMIT 1;

  SELECT id INTO tc_tl FROM formation_topic_card
    WHERE LOWER(TRIM("type")) = 'ponctuelle'
      AND (titre ILIKE '%test%' OR titre ILIKE '%logiciel%' OR titre ILIKE '%ISTQB%')
    ORDER BY id LIMIT 1;

  SELECT id INTO tc_da FROM formation_topic_card
    WHERE LOWER(TRIM("type")) = 'ponctuelle'
      AND (titre ILIKE '%data%' OR titre ILIKE '%devops%' OR titre ILIKE '%ai%')
    ORDER BY id LIMIT 1;

  SELECT id INTO tc_lg FROM formation_topic_card
    WHERE LOWER(TRIM("type")) = 'ponctuelle'
      AND (titre ILIKE '%langue%' OR titre = 'Langue')
    ORDER BY id LIMIT 1;

  SELECT id INTO tc_ss FROM formation_topic_card
    WHERE LOWER(TRIM("type")) = 'ponctuelle'
      AND (titre ILIKE '%soft%' OR titre ILIKE '%skill%')
    ORDER BY id LIMIT 1;

  -- ========== Formations (UPSERT) ==========
  INSERT INTO ponctuelle_formation (slug, topic_card_id, hero_title, hero_subtitle, hero_background_image)
  VALUES (
    'systeme-embarque', tc_se,
    'Cap vers le Réel',
    'Modules spécialisés systèmes embarqués : C, ARM, RTOS, Linux embarqué.',
    '/images/systemes-embarques.jpg'
  )
  ON CONFLICT (slug) DO UPDATE SET
    hero_title = EXCLUDED.hero_title,
    hero_subtitle = EXCLUDED.hero_subtitle,
    hero_background_image = COALESCE(EXCLUDED.hero_background_image, ponctuelle_formation.hero_background_image),
    topic_card_id = COALESCE(ponctuelle_formation.topic_card_id, EXCLUDED.topic_card_id);

  INSERT INTO ponctuelle_formation (slug, topic_card_id, hero_title, hero_subtitle, hero_background_image)
  VALUES (
    'full-stack', tc_fs,
    'Bâtissez le Web de demain',
    'Du front au back : pratique guidée et stacks modernes.',
    '/images/formation-fullstack.jpg'
  )
  ON CONFLICT (slug) DO UPDATE SET
    hero_title = EXCLUDED.hero_title,
    hero_subtitle = EXCLUDED.hero_subtitle,
    hero_background_image = COALESCE(EXCLUDED.hero_background_image, ponctuelle_formation.hero_background_image),
    topic_card_id = COALESCE(ponctuelle_formation.topic_card_id, EXCLUDED.topic_card_id);

  INSERT INTO ponctuelle_formation (slug, topic_card_id, hero_title, hero_subtitle, hero_background_image)
  VALUES (
    'test-logiciel', tc_tl,
    'Visez la perfection logicielle',
    'ISTQB, tests manuels et automatisation.',
    '/images/formation-testeur.jpg'
  )
  ON CONFLICT (slug) DO UPDATE SET
    hero_title = EXCLUDED.hero_title,
    hero_subtitle = EXCLUDED.hero_subtitle,
    hero_background_image = COALESCE(EXCLUDED.hero_background_image, ponctuelle_formation.hero_background_image),
    topic_card_id = COALESCE(ponctuelle_formation.topic_card_id, EXCLUDED.topic_card_id);

  INSERT INTO ponctuelle_formation (slug, topic_card_id, hero_title, hero_subtitle, hero_background_image)
  VALUES (
    'data-ai-devops', tc_da,
    'Data, Cloud & IA',
    'Pipelines, MLOps et bonnes pratiques DevOps.',
    '/images/formation-data-ai.jpg'
  )
  ON CONFLICT (slug) DO UPDATE SET
    hero_title = EXCLUDED.hero_title,
    hero_subtitle = EXCLUDED.hero_subtitle,
    hero_background_image = COALESCE(EXCLUDED.hero_background_image, ponctuelle_formation.hero_background_image),
    topic_card_id = COALESCE(ponctuelle_formation.topic_card_id, EXCLUDED.topic_card_id);

  INSERT INTO ponctuelle_formation (slug, topic_card_id, hero_title, hero_subtitle, hero_background_image)
  VALUES (
    'langue', tc_lg,
    'Langues & communication',
    'Renforcez vos compétences linguistiques professionnelles.',
    '/images/hero-laptop.png'
  )
  ON CONFLICT (slug) DO UPDATE SET
    hero_title = EXCLUDED.hero_title,
    hero_subtitle = EXCLUDED.hero_subtitle,
    hero_background_image = COALESCE(EXCLUDED.hero_background_image, ponctuelle_formation.hero_background_image),
    topic_card_id = COALESCE(ponctuelle_formation.topic_card_id, EXCLUDED.topic_card_id);

  INSERT INTO ponctuelle_formation (slug, topic_card_id, hero_title, hero_subtitle, hero_background_image)
  VALUES (
    'soft-skills', tc_ss,
    'Soft Skills & leadership',
    'Communication, gestion du temps et travail en équipe.',
    '/images/reconversion-hero.png'
  )
  ON CONFLICT (slug) DO UPDATE SET
    hero_title = EXCLUDED.hero_title,
    hero_subtitle = EXCLUDED.hero_subtitle,
    hero_background_image = COALESCE(EXCLUDED.hero_background_image, ponctuelle_formation.hero_background_image),
    topic_card_id = COALESCE(ponctuelle_formation.topic_card_id, EXCLUDED.topic_card_id);

  -- Liens carte thématique → slug (pour /formation et filtres)
  IF tc_se IS NOT NULL THEN
    UPDATE formation_topic_card SET ponctuelle_slug = 'systeme-embarque' WHERE id = tc_se;
  END IF;
  IF tc_fs IS NOT NULL THEN
    UPDATE formation_topic_card SET ponctuelle_slug = 'full-stack' WHERE id = tc_fs;
  END IF;
  IF tc_tl IS NOT NULL THEN
    UPDATE formation_topic_card SET ponctuelle_slug = 'test-logiciel' WHERE id = tc_tl;
  END IF;
  IF tc_da IS NOT NULL THEN
    UPDATE formation_topic_card SET ponctuelle_slug = 'data-ai-devops' WHERE id = tc_da;
  END IF;
  IF tc_lg IS NOT NULL THEN
    UPDATE formation_topic_card SET ponctuelle_slug = 'langue' WHERE id = tc_lg;
  END IF;
  IF tc_ss IS NOT NULL THEN
    UPDATE formation_topic_card SET ponctuelle_slug = 'soft-skills' WHERE id = tc_ss;
  END IF;

  -- ========== Modules d’exemple (seulement si formation sans module) ==========

  SELECT id INTO fid FROM ponctuelle_formation WHERE slug = 'systeme-embarque';
  SELECT COUNT(*)::INT INTO n FROM ponctuelle_module WHERE formation_id = fid;
  IF n = 0 THEN
    INSERT INTO ponctuelle_module (
      formation_id, sort_order, title, description, image_url,
      duration, practice, project, evaluation, hover_detail, is_certified
    ) VALUES
    (fid, 0,
     'Langage C pour systèmes embarqués',
     'Bases du C embarqué, registres, interruptions et bonnes pratiques bas niveau.',
     '/images/systemes-embarques.jpg',
     '4 jours', 'Travaux pratiques guidés', 'Mini-driver GPIO', 'QCM + mini-projet', 'STM32, HAL', TRUE),
    (fid, 1,
     'RTOS et multitâche (FreeRTOS)',
     'Tâches, files, sémaphores et debug sur cible réelle.',
     '/images/custom-dev.jpg',
     '5 jours', 'Labs temps réel', 'Portage d''un firmware', 'Évaluation pratique', 'FreeRTOS', TRUE);
  END IF;

  SELECT id INTO fid FROM ponctuelle_formation WHERE slug = 'full-stack';
  SELECT COUNT(*)::INT INTO n FROM ponctuelle_module WHERE formation_id = fid;
  IF n = 0 THEN
    INSERT INTO ponctuelle_module (
      formation_id, sort_order, title, description, image_url,
      duration, practice, project, evaluation, hover_detail, is_certified
    ) VALUES
    (fid, 0,
     'React & TypeScript',
     'Composants, hooks et état pour des interfaces professionnelles.',
     '/images/dev.png',
     '5 jours', 'Ateliers UI', 'Dashboard connecté', 'Revue de code', 'Next.js', TRUE),
    (fid, 1,
     'API Node & PostgreSQL',
     'REST, auth JWT et persistance relationnelle.',
     '/images/hero-laptop.png',
     '4 jours', 'Pair programming', 'API métier', 'Tests API', 'Express', TRUE);
  END IF;

  SELECT id INTO fid FROM ponctuelle_formation WHERE slug = 'test-logiciel';
  SELECT COUNT(*)::INT INTO n FROM ponctuelle_module WHERE formation_id = fid;
  IF n = 0 THEN
    INSERT INTO ponctuelle_module (
      formation_id, sort_order, title, description, image_url,
      duration, practice, project, evaluation, hover_detail, is_certified
    ) VALUES
    (fid, 0,
     'Fondamentaux ISTQB',
     'Niveaux de test, design de cas et traçabilité.',
     '/images/formation-testeur.jpg',
     '4 jours', 'Cas réels', 'Plan de tests', 'QCM', 'Agile testing', TRUE),
    (fid, 1,
     'Automatisation (Selenium / API)',
     'CI, pipelines et maintenance des jeux de tests.',
     '/images/formation-testeur.jpg',
     '5 jours', 'Labs', 'Suite E2E', 'Démo', 'CI/CD', TRUE);
  END IF;

  SELECT id INTO fid FROM ponctuelle_formation WHERE slug = 'data-ai-devops';
  SELECT COUNT(*)::INT INTO n FROM ponctuelle_module WHERE formation_id = fid;
  IF n = 0 THEN
    INSERT INTO ponctuelle_module (
      formation_id, sort_order, title, description, image_url,
      duration, practice, project, evaluation, hover_detail, is_certified
    ) VALUES
    (fid, 0,
     'Fondamentaux Data & SQL',
     'Modélisation, requêtes analytiques et qualité des données.',
     '/images/formation-data-ai.jpg',
     '3 jours', 'Ateliers SQL', 'Rapport décisionnel', 'Quiz', 'PostgreSQL', TRUE),
    (fid, 1,
     'CI/CD & conteneurs',
     'Docker, pipelines et déploiement sur cloud.',
     '/images/formation-data-ai.jpg',
     '4 jours', 'Labs DevOps', 'Pipeline démo', 'Revue', 'GitHub Actions', TRUE);
  END IF;

  SELECT id INTO fid FROM ponctuelle_formation WHERE slug = 'langue';
  SELECT COUNT(*)::INT INTO n FROM ponctuelle_module WHERE formation_id = fid;
  IF n = 0 THEN
    INSERT INTO ponctuelle_module (
      formation_id, sort_order, title, description, image_url,
      duration, practice, project, evaluation, hover_detail, is_certified
    ) VALUES
    (fid, 0,
     'Anglais professionnel (tech)',
     'Vocabulaire IT, réunions et documentation.',
     '/images/hero-laptop.png',
     '3 jours', 'Role-play', 'Présentation produit', 'Oral', 'B2 visé', TRUE),
    (fid, 1,
     'Communication écrite',
     'Emails, specs et clarté des messages.',
     '/images/hero-laptop.png',
     '2 jours', 'Ateliers', 'Rewriting', 'Correction', 'Style pro', TRUE);
  END IF;

  SELECT id INTO fid FROM ponctuelle_formation WHERE slug = 'soft-skills';
  SELECT COUNT(*)::INT INTO n FROM ponctuelle_module WHERE formation_id = fid;
  IF n = 0 THEN
    INSERT INTO ponctuelle_module (
      formation_id, sort_order, title, description, image_url,
      duration, practice, project, evaluation, hover_detail, is_certified
    ) VALUES
    (fid, 0,
     'Travail en équipe agile',
     'Rituels, feedback et collaboration efficace.',
     '/images/reconversion-hero.png',
     '2 jours', 'Jeux de rôle', 'Rétrospective', 'Auto-éval', 'Scrum', TRUE),
    (fid, 1,
     'Prise de parole et posture',
     'Structurer un discours et gérer le stress.',
     '/images/reconversion-hero.png',
     '2 jours', 'Exercices', 'Pitch 5 min', 'Vidéo', 'Coaching', TRUE);
  END IF;

END $$;

-- ---------------------------------------------------------------------------
-- Optionnel : aligner `formation_topic_card` (ids 4–9) et `topic_card_id` si votre
-- schéma correspond à la prod (Système Embarqué … Soft Skills).
-- À commenter si vos ids de cartes diffèrent.
-- ---------------------------------------------------------------------------
UPDATE formation_topic_card SET ponctuelle_slug = 'systeme-embarque' WHERE id = 4 AND LOWER(TRIM("type")) = 'ponctuelle';
UPDATE formation_topic_card SET ponctuelle_slug = 'full-stack'           WHERE id = 5 AND LOWER(TRIM("type")) = 'ponctuelle';
UPDATE formation_topic_card SET ponctuelle_slug = 'test-logiciel'       WHERE id = 6 AND LOWER(TRIM("type")) = 'ponctuelle';
UPDATE formation_topic_card SET ponctuelle_slug = 'data-ai-devops'       WHERE id = 7 AND LOWER(TRIM("type")) = 'ponctuelle';
UPDATE formation_topic_card SET ponctuelle_slug = 'langue'               WHERE id = 8 AND LOWER(TRIM("type")) = 'ponctuelle';
UPDATE formation_topic_card SET ponctuelle_slug = 'soft-skills'         WHERE id = 9 AND LOWER(TRIM("type")) = 'ponctuelle';

UPDATE ponctuelle_formation SET topic_card_id = 4 WHERE slug = 'systeme-embarque' AND EXISTS (SELECT 1 FROM formation_topic_card WHERE id = 4);
UPDATE ponctuelle_formation SET topic_card_id = 5 WHERE slug = 'full-stack'       AND EXISTS (SELECT 1 FROM formation_topic_card WHERE id = 5);
UPDATE ponctuelle_formation SET topic_card_id = 6 WHERE slug = 'test-logiciel'   AND EXISTS (SELECT 1 FROM formation_topic_card WHERE id = 6);
UPDATE ponctuelle_formation SET topic_card_id = 7 WHERE slug = 'data-ai-devops'   AND EXISTS (SELECT 1 FROM formation_topic_card WHERE id = 7);
UPDATE ponctuelle_formation SET topic_card_id = 8 WHERE slug = 'langue'           AND EXISTS (SELECT 1 FROM formation_topic_card WHERE id = 8);
UPDATE ponctuelle_formation SET topic_card_id = 9 WHERE slug = 'soft-skills'     AND EXISTS (SELECT 1 FROM formation_topic_card WHERE id = 9);
