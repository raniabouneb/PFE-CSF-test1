"""Pydantic schemas for the learner formations API."""

from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, Field


# ── module progress (ponctuelle) ─────────────────────────────────────────

class ModuleProgressOut(BaseModel):
    module_id: uuid.UUID
    titre: str
    duree_minutes: int | None = None
    minutes_validees: int = 0
    progress_percent: int = 0


# ── pack module progress (reconversion) ──────────────────────────────────

class PackModuleProgressOut(BaseModel):
    module_id: uuid.UUID
    titre: str
    ordre: int = 0
    statut: str = "locked"
    unlocked_at: datetime.datetime | None = None
    completed_at: datetime.datetime | None = None


# ── enrollment (formation card) ──────────────────────────────────────────

class EnrollmentOut(BaseModel):
    enrollment_id: uuid.UUID
    groupe_id: uuid.UUID
    groupe_nom: str
    type: str
    groupe_statut: str
    progress_percent: int = 0
    modules: list[ModuleProgressOut] = Field(default_factory=list)
    pack_modules: list[PackModuleProgressOut] = Field(default_factory=list)


# ── module detail ────────────────────────────────────────────────────────

class ModuleDetailOut(BaseModel):
    id: uuid.UUID
    titre: str
    description: str | None = None
    duree_minutes: int | None = None
    pdf_url: str | None = None
    minutes_validees: int = 0
    statut: str | None = None
    sessions: list[LearnerSessionOut] = Field(default_factory=list)


# ── learner session (planning) ───────────────────────────────────────────

class LearnerSessionOut(BaseModel):
    session_id: uuid.UUID
    titre: str
    date: datetime.date
    heure_debut: datetime.time | None = None
    duree_minutes: int | None = None
    lieu: str | None = None
    statut: str
    module_titre: str | None = None
    groupe_nom: str | None = None
