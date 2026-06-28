CREATE TABLE IF NOT EXISTS page_visit (
    id BIGSERIAL PRIMARY KEY,
    page_path TEXT NOT NULL,
    page_title TEXT,
    session_id VARCHAR(64) NOT NULL,
    visited_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_page_visit_page_path ON page_visit (page_path);
CREATE INDEX IF NOT EXISTS ix_page_visit_session_id ON page_visit (session_id);
CREATE INDEX IF NOT EXISTS ix_page_visit_visited_at ON page_visit (visited_at);
