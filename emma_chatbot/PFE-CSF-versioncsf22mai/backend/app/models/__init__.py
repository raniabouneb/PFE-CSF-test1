"""New LMS models (UUID-based, managed by Alembic)."""

from app.models.lms import (
    Attendance,
    Enrollment,
    Groupe,
    Module,
    PackModule,
    PackProgression,
    PackReconversion,
    Progression,
    Session,
    SessionGroup,
)

__all__ = [
    "Attendance",
    "Enrollment",
    "Groupe",
    "Module",
    "PackModule",
    "PackProgression",
    "PackReconversion",
    "Progression",
    "Session",
    "SessionGroup",
]
