-- Migration: create planning_session, planning_session_group, planning_attendance tables
-- Multi-group session system allowing one session to include multiple groups.

BEGIN;

CREATE TABLE IF NOT EXISTS planning_session (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    module_target_ref TEXT,
    module_label TEXT,
    date DATE NOT NULL,
    start_time TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planning_session_date ON planning_session (date);
CREATE INDEX IF NOT EXISTS idx_planning_session_module_target_ref ON planning_session (module_target_ref);

CREATE TABLE IF NOT EXISTS planning_session_group (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES planning_session(id) ON DELETE CASCADE,
    group_id BIGINT NOT NULL REFERENCES apprenant_group(id) ON DELETE CASCADE,
    CONSTRAINT uq_planning_session_group UNIQUE (session_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_planning_session_group_session_id ON planning_session_group (session_id);
CREATE INDEX IF NOT EXISTS idx_planning_session_group_group_id ON planning_session_group (group_id);

CREATE TABLE IF NOT EXISTS planning_attendance (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES planning_session(id) ON DELETE CASCADE,
    member_id BIGINT NOT NULL REFERENCES apprenant_group_member(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL DEFAULT false,
    marked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_planning_attendance_session_member UNIQUE (session_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_planning_attendance_session_id ON planning_attendance (session_id);
CREATE INDEX IF NOT EXISTS idx_planning_attendance_member_id ON planning_attendance (member_id);

COMMIT;
