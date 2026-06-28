-- Add cross-reference column linking group_session to planning_session
ALTER TABLE group_session
ADD COLUMN IF NOT EXISTS planning_session_id BIGINT
  REFERENCES planning_session(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_group_session_planning_session_id
  ON group_session(planning_session_id);

-- Backfill existing rows by matching title, duration, and group_id
UPDATE group_session gs
SET planning_session_id = ps.id
FROM planning_session ps
JOIN planning_session_group psg ON psg.session_id = ps.id
WHERE gs.planning_session_id IS NULL
  AND gs.group_id = psg.group_id
  AND gs.title = ps.title
  AND gs.duration_minutes = ps.duration_minutes
  AND gs.scheduled_at::date = ps.date;
