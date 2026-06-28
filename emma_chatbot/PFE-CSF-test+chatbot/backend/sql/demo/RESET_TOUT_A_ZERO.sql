-- =============================================================================
-- REMETTRE LES DASHBOARDS APPRENANT À ZÉRO (tous les utilisateurs)
--
-- Supprime : groupes, membres, séances, présences, progression, certifications
--            liées aux parcours, planning séances, inscriptions membre.
--
-- CONSERVE : comptes users (login), catalogue formations, pages admin, chat IA, etc.
--
-- Où exécuter : Supabase → SQL Editor → coller tout → Run
-- ⚠️ Irréversible sans backup.
-- =============================================================================

BEGIN;

DELETE FROM learner_notification;
DELETE FROM validation_document;
DELETE FROM module_test_score;

DELETE FROM session_attendance;
DELETE FROM planning_attendance;

DELETE FROM learner_certification_result;
DELETE FROM learner_progress;
DELETE FROM apprenant_member_note;

DELETE FROM group_session;
DELETE FROM planning_session_group;
DELETE FROM planning_session;

DELETE FROM apprenant_group_access;
DELETE FROM apprenant_group_member;
DELETE FROM apprenant_group;

DELETE FROM member_enrollment;

COMMIT;

-- Vérification rapide (doit afficher 0 partout)
SELECT 'apprenant_group' AS table_name, COUNT(*)::int AS rows FROM apprenant_group
UNION ALL SELECT 'apprenant_group_member', COUNT(*) FROM apprenant_group_member
UNION ALL SELECT 'group_session', COUNT(*) FROM group_session
UNION ALL SELECT 'session_attendance', COUNT(*) FROM session_attendance
UNION ALL SELECT 'learner_progress', COUNT(*) FROM learner_progress
UNION ALL SELECT 'learner_certification_result', COUNT(*) FROM learner_certification_result
UNION ALL SELECT 'planning_session', COUNT(*) FROM planning_session
ORDER BY 1;
