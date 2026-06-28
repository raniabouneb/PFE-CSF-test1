from __future__ import annotations

from datetime import datetime, timedelta, timezone

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None  # type: ignore[assignment]


if ZoneInfo is not None:
    TUNIS_TZ = ZoneInfo("Africa/Tunis")
else:  # pragma: no cover
    TUNIS_TZ = timezone(timedelta(hours=1))


def parse_tunis_datetime_to_utc(date_str: str, start_time: str | None) -> datetime:
    """Parse `YYYY-MM-DD` + `HH:MM[:SS]` as Africa/Tunis and return UTC."""
    time_part = start_time or "00:00"
    if time_part.count(":") == 1:
        time_part += ":00"
    local_dt = datetime.fromisoformat(f"{date_str}T{time_part}")
    if local_dt.tzinfo is None:
        local_dt = local_dt.replace(tzinfo=TUNIS_TZ)
    return local_dt.astimezone(timezone.utc)


def ensure_utc(dt: datetime) -> datetime:
    """Normalize datetime to UTC; naive values are interpreted as Africa/Tunis."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=TUNIS_TZ).astimezone(timezone.utc)
    return dt.astimezone(timezone.utc)
