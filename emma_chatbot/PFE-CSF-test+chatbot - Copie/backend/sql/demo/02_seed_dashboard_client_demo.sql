-- =============================================================================
-- SCÉNARIO DÉMO CLIENT — tableau de bord apprenant
-- Prérequis : 01_reset_learner_platform.sql + catalogue (seed_ponctuelle_certifications_examples.sql)
--
-- Modifier l'email ci-dessous (compte de connexion pour la démo) :
-- =============================================================================

DO $$
DECLARE
  -- ▼▼▼ EMAIL DU COMPTE DE DÉMO (connexion frontend) ▼▼▼
  v_demo_email       TEXT := 'benyoussefdaziz1@gmail.com';
  -- ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

  v_user_id          TEXT;
  v_member_langue    BIGINT;
  v_member_fs        BIGINT;
  v_member_test      BIGINT;
  v_grp_langue       BIGINT;
  v_grp_fs           BIGINT;
  v_grp_test         BIGINT;
  v_acc_langue       BIGINT;
  v_acc_fs           BIGINT;
  v_acc_test         BIGINT;
  v_mod_langue_id    BIGINT;
  v_mod_langue_title TEXT;
  v_mod_fs_id        BIGINT;
  v_mod_fs_title     TEXT;
  v_mod_test_id      BIGINT;
  v_mod_test_title   TEXT;
  v_ref_langue       TEXT;
  v_ref_fs           TEXT;
  v_ref_test         TEXT;
  v_form_langue      TEXT;
  v_form_fs          TEXT;
  v_sess             BIGINT;
  v_now              TIMESTAMPTZ := now();
BEGIN
  SELECT id INTO v_user_id FROM users WHERE lower(trim(email)) = lower(trim(v_demo_email)) LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur introuvable pour email=%. Créez le compte via /authentification/inscription puis relancez ce script.', v_demo_email;
  END IF;

  UPDATE users
  SET
    first_name = 'Aziz',
    last_name = 'Benyoussef',
    name = 'Aziz Benyoussef',
    role = COALESCE(NULLIF(trim(role), ''), 'apprenant')
  WHERE id = v_user_id;

  -- Modules catalogue (formations langue & full-stack & test-logiciel)
  SELECT m.id, m.title, f.hero_title
    INTO v_mod_langue_id, v_mod_langue_title, v_form_langue
  FROM ponctuelle_module m
  JOIN ponctuelle_formation f ON f.id = m.formation_id
  WHERE f.slug = 'langue'
  ORDER BY m.sort_order, m.id
  LIMIT 1;

  SELECT m.id, m.title, f.hero_title
    INTO v_mod_fs_id, v_mod_fs_title, v_form_fs
  FROM ponctuelle_module m
  JOIN ponctuelle_formation f ON f.id = m.formation_id
  WHERE f.slug = 'full-stack'
  ORDER BY m.sort_order, m.id
  LIMIT 1;

  SELECT m.id, m.title, f.hero_title
    INTO v_mod_test_id, v_mod_test_title, v_form_test
  FROM ponctuelle_module m
  JOIN ponctuelle_formation f ON f.id = m.formation_id
  WHERE f.slug = 'test-logiciel'
  ORDER BY m.sort_order, m.id
  LIMIT 1;

  IF v_mod_langue_id IS NULL OR v_mod_fs_id IS NULL THEN
    RAISE EXCEPTION 'Catalogue incomplet. Exécutez d''abord : backend/sql/seed_ponctuelle_certifications_examples.sql';
  END IF;

  v_ref_langue := 'ponctuelle_module:' || v_mod_langue_id;
  v_ref_fs := 'ponctuelle_module:' || v_mod_fs_id;
  v_ref_test := 'ponctuelle_module:' || v_mod_test_id;

  -- ── Groupe 1 : Formation linguistique (terminée, présence 50 %) ─────────────
  INSERT INTO apprenant_group (
    name, description, format, ponctuelle_formation_slug, ponctuelle_formation_slugs,
    status, start_date, end_date
  ) VALUES (
    'DÉMO · Formation linguistique',
    'Scénario client — parcours ponctuel terminé avec assiduité 50 %.',
    'ponctuelle',
    'langue',
    '["langue"]'::jsonb,
    'active',
    (CURRENT_DATE - 90),
    (CURRENT_DATE + 30)
  ) RETURNING id INTO v_grp_langue;

  INSERT INTO apprenant_group_member (
    group_id, user_id, email, email_normalized, first_name, last_name, status, points_total, linked_at
  ) VALUES (
    v_grp_langue, v_user_id, v_demo_email, lower(trim(v_demo_email)),
    'Aziz', 'Benyoussef', 'active', 85, v_now
  ) RETURNING id INTO v_member_langue;

  INSERT INTO apprenant_group_access (group_id, access_kind, target_ref, label)
  VALUES (v_grp_langue, 'ponctuelle_module', v_ref_langue, v_mod_langue_title)
  RETURNING id INTO v_acc_langue;

  INSERT INTO learner_progress (
    member_id, access_kind, target_ref, title,
    progress_percent, status, current_flag, progress_mode,
    minutes_completed, minutes_total, completed_by_admin
  ) VALUES (
    v_member_langue, 'ponctuelle_module', v_ref_langue, v_mod_langue_title,
    100, 'completed', FALSE, 'time',
    1440, 1440, FALSE
  );

  -- 4 séances passées : 8 h présent + 8 h absent → KPI 50 %
  INSERT INTO group_session (group_id, access_id, target_ref, target_kind, target_label, title, scheduled_at, duration_minutes, status)
  VALUES (v_grp_langue, v_acc_langue, v_ref_langue, 'ponctuelle_module', v_mod_langue_title, 'Séance 1 — Compréhension orale', v_now - INTERVAL '28 days', 240, 'completed')
  RETURNING id INTO v_sess;
  INSERT INTO session_attendance (session_id, member_id, status) VALUES (v_sess, v_member_langue, 'present');

  INSERT INTO group_session (group_id, access_id, target_ref, target_kind, target_label, title, scheduled_at, duration_minutes, status)
  VALUES (v_grp_langue, v_acc_langue, v_ref_langue, 'ponctuelle_module', v_mod_langue_title, 'Séance 2 — Expression écrite', v_now - INTERVAL '21 days', 240, 'completed')
  RETURNING id INTO v_sess;
  INSERT INTO session_attendance (session_id, member_id, status) VALUES (v_sess, v_member_langue, 'present');

  INSERT INTO group_session (group_id, access_id, target_ref, target_kind, target_label, title, scheduled_at, duration_minutes, status)
  VALUES (v_grp_langue, v_acc_langue, v_ref_langue, 'ponctuelle_module', v_mod_langue_title, 'Séance 3 — Grammaire professionnelle', v_now - INTERVAL '14 days', 240, 'completed')
  RETURNING id INTO v_sess;
  INSERT INTO session_attendance (session_id, member_id, status) VALUES (v_sess, v_member_langue, 'absent');

  INSERT INTO group_session (group_id, access_id, target_ref, target_kind, target_label, title, scheduled_at, duration_minutes, status)
  VALUES (v_grp_langue, v_acc_langue, v_ref_langue, 'ponctuelle_module', v_mod_langue_title, 'Séance 4 — Certification blanche', v_now - INTERVAL '7 days', 240, 'completed')
  RETURNING id INTO v_sess;
  INSERT INTO session_attendance (session_id, member_id, status) VALUES (v_sess, v_member_langue, 'absent');

  INSERT INTO learner_certification_result (member_id, title, scope_ref, score_percent, status, issuer, awarded_at)
  VALUES (v_member_langue, 'Certificat ' || v_mod_langue_title, v_ref_langue, 88, 'passed', 'CSF Formation', v_now - INTERVAL '5 days');

  -- ── Groupe 2 : Full-Stack (en cours, progression 33 %) ─────────────────────
  INSERT INTO apprenant_group (
    name, description, format, ponctuelle_formation_slug, ponctuelle_formation_slugs,
    status, start_date, end_date
  ) VALUES (
    'DÉMO · Développement Full-Stack',
    'Scénario client — formation active avec progression visible.',
    'ponctuelle',
    'full-stack',
    '["full-stack"]'::jsonb,
    'active',
    (CURRENT_DATE - 45),
    (CURRENT_DATE + 60)
  ) RETURNING id INTO v_grp_fs;

  INSERT INTO apprenant_group_member (
    group_id, user_id, email, email_normalized, first_name, last_name, status, points_total, linked_at
  ) VALUES (
    v_grp_fs, v_user_id, v_demo_email, lower(trim(v_demo_email)),
    'Aziz', 'Benyoussef', 'active', 42, v_now
  ) RETURNING id INTO v_member_fs;

  INSERT INTO apprenant_group_access (group_id, access_kind, target_ref, label)
  VALUES (v_grp_fs, 'ponctuelle_module', v_ref_fs, v_mod_fs_title)
  RETURNING id INTO v_acc_fs;

  INSERT INTO learner_progress (
    member_id, access_kind, target_ref, title,
    progress_percent, status, current_flag, progress_mode,
    minutes_completed, minutes_total
  ) VALUES (
    v_member_fs, 'ponctuelle_module', v_ref_fs, v_mod_fs_title,
    33, 'in_progress', TRUE, 'time',
    720, 2160
  );

  INSERT INTO group_session (group_id, access_id, target_ref, target_kind, target_label, title, scheduled_at, duration_minutes, status)
  VALUES (v_grp_fs, v_acc_fs, v_ref_fs, 'ponctuelle_module', v_mod_fs_title, 'Atelier React — composants', v_now - INTERVAL '10 days', 240, 'completed')
  RETURNING id INTO v_sess;
  INSERT INTO session_attendance (session_id, member_id, status) VALUES (v_sess, v_member_fs, 'present');

  INSERT INTO group_session (group_id, access_id, target_ref, target_kind, target_label, title, scheduled_at, duration_minutes, status)
  VALUES (v_grp_fs, v_acc_fs, v_ref_fs, 'ponctuelle_module', v_mod_fs_title, 'Atelier API Node', v_now - INTERVAL '3 days', 240, 'completed')
  RETURNING id INTO v_sess;
  INSERT INTO session_attendance (session_id, member_id, status) VALUES (v_sess, v_member_fs, 'absent');

  -- Séances à venir (calendrier dashboard)
  INSERT INTO group_session (group_id, access_id, target_ref, target_kind, target_label, title, scheduled_at, duration_minutes, status)
  VALUES (v_grp_fs, v_acc_fs, v_ref_fs, 'ponctuelle_module', v_mod_fs_title, 'Prochain cours — Déploiement', v_now + INTERVAL '3 days', 180, 'planned')
  RETURNING id INTO v_sess;
  INSERT INTO session_attendance (session_id, member_id, status) VALUES (v_sess, v_member_fs, 'pending');

  INSERT INTO group_session (group_id, access_id, target_ref, target_kind, target_label, title, scheduled_at, duration_minutes, status)
  VALUES (v_grp_langue, v_acc_langue, v_ref_langue, 'ponctuelle_module', v_mod_langue_title, 'Point bilan — suivi individuel', v_now + INTERVAL '7 days', 120, 'planned')
  RETURNING id INTO v_sess;
  INSERT INTO session_attendance (session_id, member_id, status) VALUES (v_sess, v_member_langue, 'pending');

  INSERT INTO learner_certification_result (member_id, title, scope_ref, score_percent, status, issuer, awarded_at)
  VALUES (v_member_fs, 'Certificat ' || v_mod_fs_title, v_ref_fs, 76, 'passed', 'CSF Formation', v_now - INTERVAL '2 days');

  -- ── Groupe 3 : Test logiciel (2e certificat + barre formations) ───────────
  IF v_mod_test_id IS NOT NULL THEN
    INSERT INTO apprenant_group (
      name, description, format, ponctuelle_formation_slug, ponctuelle_formation_slugs,
      status, start_date, end_date
    ) VALUES (
      'DÉMO · Test logiciel',
      'Scénario client — troisième inscription pour diversifier les KPI.',
      'ponctuelle',
      'test-logiciel',
      '["test-logiciel"]'::jsonb,
      'active',
      (CURRENT_DATE - 20),
      (CURRENT_DATE + 45)
    ) RETURNING id INTO v_grp_test;

    INSERT INTO apprenant_group_member (
      group_id, user_id, email, email_normalized, first_name, last_name, status, points_total, linked_at
    ) VALUES (
      v_grp_test, v_user_id, v_demo_email, lower(trim(v_demo_email)),
      'Aziz', 'Benyoussef', 'active', 30, v_now
    ) RETURNING id INTO v_member_test;

    INSERT INTO apprenant_group_access (group_id, access_kind, target_ref, label)
    VALUES (v_grp_test, 'ponctuelle_module', v_ref_test, v_mod_test_title)
    RETURNING id INTO v_acc_test;

    INSERT INTO learner_progress (
      member_id, access_kind, target_ref, title,
      progress_percent, status, current_flag, progress_mode,
      minutes_completed, minutes_total
    ) VALUES (
      v_member_test, 'ponctuelle_module', v_ref_test, v_mod_test_title,
      60, 'in_progress', FALSE, 'time',
      360, 600
    );

    INSERT INTO group_session (group_id, access_id, target_ref, target_kind, target_label, title, scheduled_at, duration_minutes, status)
    VALUES (v_grp_test, v_acc_test, v_ref_test, 'ponctuelle_module', v_mod_test_title, 'Fondamentaux ISTQB', v_now - INTERVAL '5 days', 180, 'completed')
    RETURNING id INTO v_sess;
    INSERT INTO session_attendance (session_id, member_id, status) VALUES (v_sess, v_member_test, 'present');
  END IF;

  RAISE NOTICE '✓ Scénario démo créé pour % (user_id=%)', v_demo_email, v_user_id;
  RAISE NOTICE '  → 3 formations, présence langue 50 %% (8h/8h), full-stack 33 %%, certifications 2/2';
  RAISE NOTICE '  → Connexion : http://localhost:3000/authentification/connexion';
  RAISE NOTICE '  → Dashboard : http://localhost:3000/dashboard';
END $$;
