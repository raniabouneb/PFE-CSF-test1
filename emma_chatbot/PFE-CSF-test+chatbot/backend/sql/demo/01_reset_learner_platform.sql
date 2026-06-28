-- =============================================================================
-- RÉINITIALISATION — données « espace apprenant » (groupes, séances, présences…)
-- Ne supprime PAS : users, catalogue (formations ponctuelles), admin staff, hero, etc.
--
-- ⚠️ À n'exécuter que sur une base de TEST / démo, pas en production sans sauvegarde.
-- Usage : Supabase SQL Editor, ou psql "$DATABASE_URL" -f backend/sql/demo/01_reset_learner_platform.sql
-- =============================================================================

BEGIN;

-- Notifications & validations liées aux membres
DELETE FROM learner_notification;
DELETE FROM validation_document;
DELETE FROM module_test_score;

-- Présences & progression
DELETE FROM session_attendance;
DELETE FROM planning_attendance;
DELETE FROM learner_certification_result;
DELETE FROM learner_progress;
DELETE FROM apprenant_member_note;

-- Séances & planning lié aux groupes
DELETE FROM group_session;
DELETE FROM planning_session_group;
DELETE FROM planning_session;

-- Groupes apprenants
DELETE FROM apprenant_group_access;
DELETE FROM apprenant_group_member;
DELETE FROM apprenant_group;

-- Inscriptions directes (optionnel)
DELETE FROM member_enrollment;

COMMIT;

-- (Voir aussi RESET_TOUT_A_ZERO.sql — même contenu + contrôle des compteurs à 0)
