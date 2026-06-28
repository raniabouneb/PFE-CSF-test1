-- ============================================================
-- Seed script for LMS tables (demo / test data)
-- Run AFTER the Alembic migration 87c318fceacc has been applied.
--
-- Usage:  psql -f backend/sql/seed_lms_demo.sql
--   or    execute via Supabase SQL editor
--
-- This script uses a real user from the users table.
-- If the tables already have data, it skips gracefully.
-- ============================================================

DO $$
DECLARE
  v_user_id      TEXT;
  v_user2_id     TEXT;

  -- Modules
  v_mod_python   UUID;
  v_mod_aws      UUID;
  v_mod_devops   UUID;
  v_mod_rtos     UUID;
  v_mod_api      UUID;
  v_mod_sprint   UUID;

  -- Pack
  v_pack_id      UUID;

  -- Groupes
  v_grp_ponc     UUID;
  v_grp_reconv   UUID;

  -- Enrollments
  v_enr_ponc     UUID;
  v_enr_reconv   UUID;

  -- Sessions
  v_ses1         UUID;
  v_ses2         UUID;
  v_ses3         UUID;
  v_ses4         UUID;
  v_ses5         UUID;
BEGIN
  -- ── Grab two real users ─────────────────────────────────────────
  SELECT id INTO v_user_id  FROM users ORDER BY id LIMIT 1;
  SELECT id INTO v_user2_id FROM users ORDER BY id OFFSET 1 LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found – cannot seed LMS data.';
    RETURN;
  END IF;
  IF v_user2_id IS NULL THEN
    v_user2_id := v_user_id;
  END IF;

  -- Skip if data already exists
  IF EXISTS (SELECT 1 FROM modules LIMIT 1) THEN
    RAISE NOTICE 'LMS tables already contain data – skipping seed.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding LMS with user1=% user2=%', v_user_id, v_user2_id;

  -- ── 1. Modules ──────────────────────────────────────────────────
  INSERT INTO modules (id, titre, description, duree_minutes, pdf_url)
  VALUES
    (gen_random_uuid(), 'Python avancé',
     'Maîtrisez les concepts avancés de Python : décorateurs, métaclasses, asyncio.',
     600, NULL)
  RETURNING id INTO v_mod_python;

  INSERT INTO modules (id, titre, description, duree_minutes, pdf_url)
  VALUES
    (gen_random_uuid(), 'AWS Cloud Architecture',
     'Conception d''architectures cloud sécurisées et scalables sur AWS.',
     480, NULL)
  RETURNING id INTO v_mod_aws;

  INSERT INTO modules (id, titre, description, duree_minutes, pdf_url)
  VALUES
    (gen_random_uuid(), 'DevOps CI/CD',
     'Mise en place de pipelines CI/CD avec GitHub Actions, Docker et Kubernetes.',
     360, NULL)
  RETURNING id INTO v_mod_devops;

  INSERT INTO modules (id, titre, description, duree_minutes, pdf_url)
  VALUES
    (gen_random_uuid(), 'RTOS — Systèmes temps réel',
     'Introduction aux systèmes embarqués temps réel : FreeRTOS, scheduling, interruptions.',
     300, NULL)
  RETURNING id INTO v_mod_rtos;

  INSERT INTO modules (id, titre, description, duree_minutes, pdf_url)
  VALUES
    (gen_random_uuid(), 'API REST & Sécurité',
     'Conception d''APIs RESTful sécurisées : OAuth2, JWT, rate limiting.',
     240, NULL)
  RETURNING id INTO v_mod_api;

  INSERT INTO modules (id, titre, description, duree_minutes, pdf_url)
  VALUES
    (gen_random_uuid(), 'Sprint Review & Agile',
     'Méthodologies agiles : Scrum, Kanban, sprint planning et rétrospectives.',
     180, NULL)
  RETURNING id INTO v_mod_sprint;

  -- ── 2. Pack reconversion ────────────────────────────────────────
  INSERT INTO pack_reconversion (id, nom, description, statut)
  VALUES
    (gen_random_uuid(), 'Data Engineer Full Stack',
     'Parcours complet pour devenir Data Engineer : Python, AWS, DevOps.',
     'active')
  RETURNING id INTO v_pack_id;

  INSERT INTO pack_modules (pack_id, module_id, ordre) VALUES
    (v_pack_id, v_mod_python,  1),
    (v_pack_id, v_mod_aws,     2),
    (v_pack_id, v_mod_devops,  3),
    (v_pack_id, v_mod_api,     4);

  -- ── 3. Groupes ──────────────────────────────────────────────────
  INSERT INTO groupes (id, nom, type, statut)
  VALUES (gen_random_uuid(), 'Groupe A — Ponctuelle', 'ponctuelle', 'active')
  RETURNING id INTO v_grp_ponc;

  INSERT INTO groupes (id, nom, type, statut)
  VALUES (gen_random_uuid(), 'Groupe B — Reconversion', 'reconversion', 'active')
  RETURNING id INTO v_grp_reconv;

  -- ── 4. Enrollments ──────────────────────────────────────────────
  INSERT INTO enrollments (id, apprenant_id, groupe_id)
  VALUES (gen_random_uuid(), v_user_id, v_grp_ponc)
  RETURNING id INTO v_enr_ponc;

  INSERT INTO enrollments (id, apprenant_id, groupe_id)
  VALUES (gen_random_uuid(), v_user_id, v_grp_reconv)
  RETURNING id INTO v_enr_reconv;

  -- Second user also in both groups
  INSERT INTO enrollments (apprenant_id, groupe_id)
  VALUES (v_user2_id, v_grp_ponc)
  ON CONFLICT DO NOTHING;

  INSERT INTO enrollments (apprenant_id, groupe_id)
  VALUES (v_user2_id, v_grp_reconv)
  ON CONFLICT DO NOTHING;

  -- ── 5. Sessions (5 séances réparties sur ce mois et le prochain) ──
  INSERT INTO sessions (id, module_id, titre, date, heure_debut, duree_minutes, lieu, statut)
  VALUES
    (gen_random_uuid(), v_mod_python,
     'Python avancé — TP décorateurs',
     CURRENT_DATE + INTERVAL '2 days', '09:00:00', 120, 'Salle A1', 'planifiee')
  RETURNING id INTO v_ses1;

  INSERT INTO sessions (id, module_id, titre, date, heure_debut, duree_minutes, lieu, statut)
  VALUES
    (gen_random_uuid(), v_mod_aws,
     'AWS — Lab VPC & EC2',
     CURRENT_DATE + INTERVAL '5 days', '14:00:00', 180, 'Lab Cloud', 'planifiee')
  RETURNING id INTO v_ses2;

  INSERT INTO sessions (id, module_id, titre, date, heure_debut, duree_minutes, lieu, statut)
  VALUES
    (gen_random_uuid(), v_mod_devops,
     'DevOps — Pipeline GitHub Actions',
     CURRENT_DATE + INTERVAL '8 days', '10:30:00', 150, 'Salle B2', 'planifiee')
  RETURNING id INTO v_ses3;

  INSERT INTO sessions (id, module_id, titre, date, heure_debut, duree_minutes, lieu, statut)
  VALUES
    (gen_random_uuid(), v_mod_rtos,
     'RTOS — Scheduling & IRQ',
     CURRENT_DATE + INTERVAL '12 days', '09:00:00', 120, 'Salle C1', 'planifiee')
  RETURNING id INTO v_ses4;

  INSERT INTO sessions (id, module_id, titre, date, heure_debut, duree_minutes, lieu, statut)
  VALUES
    (gen_random_uuid(), v_mod_api,
     'API REST — OAuth2 hands-on',
     CURRENT_DATE - INTERVAL '3 days', '14:00:00', 120, 'Salle A1', 'terminee')
  RETURNING id INTO v_ses5;

  -- Link sessions to groups
  INSERT INTO session_groups (session_id, groupe_id) VALUES
    (v_ses1, v_grp_ponc),
    (v_ses2, v_grp_reconv),
    (v_ses3, v_grp_ponc),
    (v_ses3, v_grp_reconv),    -- mixed session
    (v_ses4, v_grp_ponc),
    (v_ses5, v_grp_ponc);

  -- ── 6. Attendance (for the completed session) ───────────────────
  INSERT INTO attendance (session_id, apprenant_id, present, marked_at)
  VALUES
    (v_ses5, v_user_id, TRUE, NOW()),
    (v_ses5, v_user2_id, FALSE, NOW());

  -- ── 7. Progression (ponctuelle — user1 validated 120 min on API module) ──
  INSERT INTO progression (enrollment_id, module_id, minutes_validees)
  VALUES (v_enr_ponc, v_mod_api, 120);

  -- ── 8. Pack progression (reconversion — sequential unlock) ──────
  INSERT INTO pack_progression (enrollment_id, module_id, statut, unlocked_at, completed_at)
  VALUES
    (v_enr_reconv, v_mod_python,  'done',   NOW() - INTERVAL '30 days', NOW() - INTERVAL '10 days'),
    (v_enr_reconv, v_mod_aws,     'open',   NOW() - INTERVAL '5 days',  NULL),
    (v_enr_reconv, v_mod_devops,  'locked', NULL, NULL),
    (v_enr_reconv, v_mod_api,     'locked', NULL, NULL);

  RAISE NOTICE 'LMS seed data inserted successfully.';
END $$;
