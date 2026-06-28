from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

ValidationDocKind = Literal["certificate", "recommendation"]
ValidationDocStatus = Literal["pending_admin", "validated", "rejected"]
SystemResult = Literal["success", "failure"]


class AbsenceSessionItem(BaseModel):
    session_id: int
    title: str
    scheduled_at: str | None = None


class ValidationQueueItem(BaseModel):
    id: int
    memberId: int
    memberName: str
    memberEmail: str
    groupId: int
    groupName: str
    kind: ValidationDocKind
    scopeRef: str
    scopeLabel: str
    presencePercent: int
    absenceCount: int
    absenceSessions: list[AbsenceSessionItem] = Field(default_factory=list)
    testScorePercent: int | None = None
    systemResult: SystemResult
    systemReason: str
    status: ValidationDocStatus
    submittedAt: datetime | None = None


class ValidationQueueResponse(BaseModel):
    items: list[ValidationQueueItem]


class ValidationDocDetail(ValidationQueueItem):
    rejectionReason: str | None = None
    reviewedByUserId: str | None = None
    reviewedAt: datetime | None = None
    pdfPath: str | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class ValidationDocDetailResponse(BaseModel):
    data: ValidationDocDetail


class RejectBody(BaseModel):
    rejection_reason: str = Field(..., min_length=1, max_length=2000)


class ValidationActionResponse(BaseModel):
    ok: bool = True
    status: ValidationDocStatus
    pdfPath: str | None = None


class ValidationStatsResponse(BaseModel):
    pending_count: int
    validated_this_month: int
    rejected_this_month: int


class TestScoreBody(BaseModel):
    member_id: int
    module_ref: str = Field(..., min_length=1)
    score_percent: int = Field(..., ge=0, le=100)
    external_ref: str | None = None


class TestScoreResponse(BaseModel):
    ok: bool = True
    document_created: bool = False
    system_result: str | None = None


class NotificationItem(BaseModel):
    id: int
    kind: str
    title: str
    body: str | None = None
    linkRef: str | None = None
    isRead: bool
    createdAt: datetime | None = None


class NotificationsResponse(BaseModel):
    items: list[NotificationItem]


class ReadNotificationResponse(BaseModel):
    ok: bool = True
