"""Pydantic schemas for the LMS sessions API."""

from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, Field


# ── Input ────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    module_id: uuid.UUID | None = None
    titre: str
    date: datetime.date
    heure_debut: datetime.time | None = None
    duree_minutes: int | None = None
    lieu: str | None = None
    statut: str = "planifiee"
    group_ids: list[uuid.UUID] = Field(default_factory=list)


class SessionPatch(BaseModel):
    titre: str | None = None
    date: datetime.date | None = None
    heure_debut: datetime.time | None = None
    duree_minutes: int | None = None
    lieu: str | None = None
    statut: str | None = None
    module_id: uuid.UUID | None = None


class GroupAddBody(BaseModel):
    groupe_id: uuid.UUID


class AttendanceMark(BaseModel):
    apprenant_id: str
    present: bool


class UnlockModuleBody(BaseModel):
    module_id: uuid.UUID


# ── Output — sub-objects ─────────────────────────────────────────────────

class ModuleRef(BaseModel):
    id: uuid.UUID
    titre: str
    duree_minutes: int | None = None

    model_config = {"from_attributes": True}


class GroupeRef(BaseModel):
    id: uuid.UUID
    nom: str
    type: str
    statut: str

    model_config = {"from_attributes": True}


# ── Output — sessions ───────────────────────────────────────────────────

class SessionOut(BaseModel):
    id: uuid.UUID
    module_id: uuid.UUID | None = None
    titre: str
    date: datetime.date
    heure_debut: datetime.time | None = None
    duree_minutes: int | None = None
    lieu: str | None = None
    statut: str
    created_at: datetime.datetime | None = None

    model_config = {"from_attributes": True}


class SessionWithGroups(SessionOut):
    module: ModuleRef | None = None
    groupes: list[GroupeRef] = Field(default_factory=list)


class SessionDetail(SessionWithGroups):
    apprenants: list[ApprenantInSession] = Field(default_factory=list)


# ── Output — apprenants par session ──────────────────────────────────────

class ApprenantInSession(BaseModel):
    apprenant_id: str
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    enrollment_type: str


class AttendanceOut(BaseModel):
    apprenant_id: str
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    enrollment_type: str
    present: bool
    marked_at: datetime.datetime | None = None
