"""Crée google_calendar_token + planning_session.google_event_id si absents (Supabase)."""

from sqlalchemy import text

from app.persistence.session import SessionLocal


def main() -> None:
    db = SessionLocal()
    try:
        db.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS google_calendar_token (
                    id BIGSERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                    access_token TEXT NOT NULL,
                    refresh_token TEXT NOT NULL,
                    token_expiry TIMESTAMPTZ,
                    calendar_id TEXT NOT NULL DEFAULT 'primary',
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                );
                """
            )
        )
        db.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_google_calendar_token_user_id
                ON google_calendar_token (user_id);
                """
            )
        )
        db.execute(
            text(
                """
                ALTER TABLE planning_session
                ADD COLUMN IF NOT EXISTS google_event_id TEXT;
                """
            )
        )
        db.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_planning_session_google_event_id
                ON planning_session (google_event_id);
                """
            )
        )
        db.commit()
        print("OK: schéma Google Calendar prêt.")
    except Exception as exc:
        db.rollback()
        raise SystemExit(f"Échec: {exc}") from exc
    finally:
        db.close()


if __name__ == "__main__":
    main()
