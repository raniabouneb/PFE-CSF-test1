from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class PlanningSessionItem(BaseModel):
    id: str
    groupId: str
    title: str
    groupLabel: str
    targetLabel: str | None = None
    scheduledAt: datetime
    dateISO: str
    startTime: str
    endTime: str
    durationMinutes: int
    status: str


class ReminderChannels(BaseModel):
    email: bool = True
    sms: bool = False


class ReminderRuleDto(BaseModel):
    id: str
    label: str
    enabled: bool = True
    hoursBefore: int = Field(24, ge=1, le=720)
    channels: ReminderChannels


class DailyNotificationDigestDto(BaseModel):
    dateISO: str
    expectedRuns: int
    completedRuns: int
    failedRuns: int


class PlanningOverviewResponse(BaseModel):
    dateISO: str
    sessions: list[PlanningSessionItem]
    rules: list[ReminderRuleDto]
    digest: DailyNotificationDigestDto


class ReminderRuleInput(BaseModel):
    id: str | None = None
    label: str = Field(..., min_length=1, max_length=200)
    enabled: bool = True
    hoursBefore: int = Field(24, ge=1, le=720)
    channels: ReminderChannels


class ReminderRulesPatchBody(BaseModel):
    rules: list[ReminderRuleInput]


class ReminderRulesMutationResponse(BaseModel):
    rules: list[ReminderRuleDto]


class PlanningDateRangeQuery(BaseModel):
    startDate: date
    endDate: date
    date: date


# --- Multi-group planning session schemas ---


class PlanningSessionCreate(BaseModel):
    title: str
    module_target_ref: str | None = None
    module_label: str | None = None
    date: str  # YYYY-MM-DD
    start_time: str | None = None  # HH:MM
    duration_minutes: int = 0
    location: str | None = None
    group_ids: list[int]


class PlanningSessionPatch(BaseModel):
    title: str | None = None
    date: str | None = None
    start_time: str | None = None
    duration_minutes: int | None = None
    location: str | None = None
    status: str | None = None


class AttendanceRecord(BaseModel):
    member_id: int
    present: bool


class AttendanceSaveBody(BaseModel):
    records: list[AttendanceRecord]


class UnlockModuleBody(BaseModel):
    member_id: int
    target_ref: str


class AddGroupBody(BaseModel):
    group_id: int


class ImportGoogleEventBody(BaseModel):
    google_event_id: str = Field(..., min_length=1)
    group_id: int
    module_target_ref: str = Field(..., min_length=1)
    module_label: str = Field(..., min_length=1)


class AutoLinkGoogleEventBody(BaseModel):
    group_id: int
    module_target_ref: str = Field(..., min_length=1)
    module_label: str = Field(..., min_length=1)
    since: str = Field(..., min_length=10, description="ISO-8601 — début de surveillance")
    session_label: str | None = None
    google_event_id: str | None = None
