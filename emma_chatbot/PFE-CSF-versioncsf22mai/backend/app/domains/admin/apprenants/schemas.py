from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

ModuleFormat = Literal["reconversion", "ponctuelle", "sur_mesure"]
GroupStatus = Literal["pending", "active", "terminee", "suspendue"]
MemberStatus = Literal["pending", "linked", "active", "archived"]
AccessKind = Literal[
    "reconversion_topic",
    "reconversion_pack",
    "ponctuelle_formation",
    "reconversion_module",
    "ponctuelle_module",
]
SessionStatus = Literal["planned", "completed", "cancelled"]
AttendanceStatus = Literal["present", "absent", "excused", "pending"]
ImportRowResolution = Literal["found", "new", "error"]
ProgressStatus = Literal["not_started", "in_progress", "completed"]
CertificationStatus = Literal["pending", "passed", "failed", "available", "locked", "unlocked"]
NoteType = Literal["info", "warning", "success"]
HistoryType = Literal["formation", "evaluation", "presence", "points", "note"]


class FilterOption(BaseModel):
    id: str
    label: str


class ReconversionPackOption(BaseModel):
    id: str
    label: str
    topicSlug: str
    variantSlug: str
    packKind: str


class ApprenantsKpis(BaseModel):
    groups: int
    members: int
    averageProgress: int


class ApprenantsFiltersResponse(BaseModel):
    formats: list[FilterOption]
    reconversionTopics: list[FilterOption]
    reconversionPacks: list[ReconversionPackOption]
    ponctuelleFormations: list[FilterOption]
    kpis: ApprenantsKpis


class GroupSummary(BaseModel):
    id: str
    name: str
    description: str | None = None
    formationLabel: str
    format: ModuleFormat
    status: GroupStatus
    startDate: date | None = None
    endDate: date | None = None
    reconversionTopicSlug: str | None = None
    reconversionTopicLabel: str | None = None
    reconversionPackId: str | None = None
    reconversionPackLabel: str | None = None
    ponctuelleFormationSlug: str | None = None
    ponctuelleFormationLabel: str | None = None
    ponctuelleFormationSlugs: list[str] = Field(default_factory=list)
    ponctuelleFormationLabels: list[str] = Field(default_factory=list)
    memberCount: int
    progressAverage: int
    accessCount: int


class GroupMemberDto(BaseModel):
    id: str
    groupId: str
    userId: str | None = None
    email: str
    firstName: str | None = None
    lastName: str | None = None
    fullName: str
    status: MemberStatus
    pointsTotal: int
    linkedAt: datetime | None = None
    attendanceRate: int
    progressAverage: int
    notesCount: int


class GroupAccessDto(BaseModel):
    id: str
    groupId: str
    accessKind: AccessKind
    targetRef: str
    label: str
    kindLabel: str
    targetLabel: str
    formationLabel: str | None = None


class AttendanceItemDto(BaseModel):
    memberId: str
    status: AttendanceStatus
    note: str | None = None


class AttendanceSummaryDto(BaseModel):
    total: int
    present: int
    absent: int
    excused: int
    pending: int


class GroupSessionDto(BaseModel):
    id: str
    groupId: str
    accessId: str | None = None
    targetRef: str | None = None
    targetKind: str | None = None
    targetLabel: str | None = None
    title: str
    scheduledAt: datetime
    durationMinutes: int
    status: SessionStatus
    notes: str | None = None
    attendanceSummary: AttendanceSummaryDto
    attendance: list[AttendanceItemDto] = Field(default_factory=list)


class MemberProgressDto(BaseModel):
    id: str
    memberId: str
    accessKind: str
    targetRef: str
    title: str
    progressPercent: int
    status: ProgressStatus
    scorePercent: int | None = None
    currentFlag: bool = False
    locked: bool = False
    openedByAdmin: bool = False
    completedByAdmin: bool = False
    progressMode: str = "manual"
    minutesCompleted: int = 0
    minutesTotal: int | None = None
    note: str | None = None
    updatedAt: datetime | None = None


class MemberCertificationDto(BaseModel):
    id: str
    memberId: str
    title: str
    scopeRef: str | None = None
    scorePercent: int | None = None
    status: CertificationStatus
    issuer: str | None = None
    awardedAt: datetime | None = None


class MemberNoteDto(BaseModel):
    id: str
    memberId: str
    authorName: str
    noteType: NoteType
    content: str
    createdAt: datetime


class MemberHistoryDto(BaseModel):
    id: str
    date: datetime
    action: str
    details: str
    type: HistoryType


class GroupDetailDto(BaseModel):
    group: GroupSummary
    members: list[GroupMemberDto]
    accesses: list[GroupAccessDto]
    sessions: list[GroupSessionDto]


class MemberProfileDto(BaseModel):
    member: GroupMemberDto
    group: GroupSummary
    accesses: list[GroupAccessDto]
    progress: list[MemberProgressDto]
    certifications: list[MemberCertificationDto]
    notes: list[MemberNoteDto]
    history: list[MemberHistoryDto]
    learnerCv: dict | None = None


class GroupListResponse(BaseModel):
    items: list[GroupSummary]


class GroupDetailResponse(BaseModel):
    data: GroupDetailDto


class MemberProfileResponse(BaseModel):
    data: MemberProfileDto


class GroupCreateBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)
    description: str | None = Field(None, max_length=2000)
    format: ModuleFormat
    reconversionTopicSlug: str | None = None
    reconversionPackId: str | None = None
    ponctuelleFormationSlug: str | None = None
    ponctuelleModuleRefs: list[str] = Field(default_factory=list)
    startDate: date | None = None
    endDate: date | None = None
    status: GroupStatus = "pending"


class GroupPatchBody(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=300)
    description: str | None = Field(None, max_length=2000)
    reconversionTopicSlug: str | None = None
    reconversionPackId: str | None = None
    ponctuelleFormationSlug: str | None = None
    ponctuelleModuleRefs: list[str] | None = None
    startDate: date | None = None
    endDate: date | None = None
    status: GroupStatus | None = None


class GroupMutationResponse(BaseModel):
    group: GroupSummary


class GroupMemberCreateBody(BaseModel):
    email: EmailStr
    firstName: str | None = Field(None, max_length=120)
    lastName: str | None = Field(None, max_length=120)


class GroupMemberPatchBody(BaseModel):
    firstName: str | None = Field(None, max_length=120)
    lastName: str | None = Field(None, max_length=120)
    status: MemberStatus | None = None
    pointsTotal: int | None = Field(None, ge=0, le=100000)


class GroupMemberMutationResponse(BaseModel):
    member: GroupMemberDto


class GroupAccessCreateBody(BaseModel):
    accessKind: AccessKind
    targetRef: str = Field(..., min_length=1, max_length=300)


class GroupAccessMutationResponse(BaseModel):
    access: GroupAccessDto


class GroupSessionCreateBody(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    accessId: str | None = None
    targetRef: str | None = Field(None, max_length=300)
    targetKind: str | None = Field(None, max_length=80)
    targetLabel: str | None = Field(None, max_length=400)
    scheduledAt: datetime
    durationMinutes: int = Field(120, ge=0, le=10000)
    status: SessionStatus = "planned"
    notes: str | None = Field(None, max_length=4000)


class GroupSessionMutationResponse(BaseModel):
    session: GroupSessionDto


class GroupSessionPatchBody(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    accessId: str | None = None
    targetRef: str | None = Field(None, max_length=300)
    targetKind: str | None = Field(None, max_length=80)
    targetLabel: str | None = Field(None, max_length=400)
    scheduledAt: datetime | None = None
    durationMinutes: int | None = Field(None, ge=0, le=10000)
    status: SessionStatus | None = None
    notes: str | None = Field(None, max_length=4000)


class AttendancePatchItem(BaseModel):
    memberId: str
    status: AttendanceStatus
    note: str | None = Field(None, max_length=1000)


class SessionAttendancePatchBody(BaseModel):
    items: list[AttendancePatchItem]


class SessionAttendanceMutationResponse(BaseModel):
    session: GroupSessionDto


class ProgressUpsertItem(BaseModel):
    targetRef: str = Field(..., min_length=1, max_length=300)
    accessKind: str = Field(..., min_length=1, max_length=80)
    title: str = Field(..., min_length=1, max_length=400)
    progressPercent: int = Field(..., ge=0, le=100)
    status: ProgressStatus
    scorePercent: int | None = Field(None, ge=0, le=100)
    currentFlag: bool = False
    locked: bool = False
    openedByAdmin: bool = False
    completedByAdmin: bool = False
    progressMode: str = "manual"
    minutesCompleted: int = Field(0, ge=0, le=1000000)
    minutesTotal: int | None = Field(None, ge=0, le=1000000)
    note: str | None = Field(None, max_length=2000)


class MemberProgressPatchBody(BaseModel):
    items: list[ProgressUpsertItem]


class MemberProgressMutationResponse(BaseModel):
    items: list[MemberProgressDto]


class CertificationUpsertItem(BaseModel):
    id: str | None = None
    title: str = Field(..., min_length=1, max_length=400)
    scopeRef: str | None = Field(None, max_length=300)
    scorePercent: int | None = Field(None, ge=0, le=100)
    status: CertificationStatus
    issuer: str | None = Field(None, max_length=200)
    awardedAt: datetime | None = None


class MemberCertificationPatchBody(BaseModel):
    items: list[CertificationUpsertItem]


class MemberCertificationMutationResponse(BaseModel):
    items: list[MemberCertificationDto]


class MemberNoteCreateBody(BaseModel):
    noteType: NoteType = "info"
    content: str = Field(..., min_length=1, max_length=4000)


class MemberNoteMutationResponse(BaseModel):
    note: MemberNoteDto


class MemberAttendanceHistoryItem(BaseModel):
    sessionId: str
    sessionTitle: str
    scheduledAt: datetime
    targetLabel: str | None = None
    status: AttendanceStatus


class MemberAttendanceHistoryResponse(BaseModel):
    items: list[MemberAttendanceHistoryItem]
    attendanceRate: int


class DeleteResponse(BaseModel):
    ok: bool = True


class ImportRow(BaseModel):
    rowIndex: int
    date: str | None = None
    heure: str | None = None
    email: str
    statut: AttendanceStatus | None = None
    resolution: ImportRowResolution
    errorMessage: str | None = None


class AttendanceImportPreview(BaseModel):
    rows: list[ImportRow]
    foundCount: int
    newCount: int
    errorCount: int


class ConfirmImportRow(BaseModel):
    email: str
    statut: AttendanceStatus
    createIfNew: bool = False


class AttendanceImportConfirmBody(BaseModel):
    rows: list[ConfirmImportRow]


class SessionImportGroup(BaseModel):
    dateKey: str
    heureKey: str
    sessionId: str | None = None
    sessionTitle: str | None = None
    sessionResolution: Literal["found", "missing"]
    rows: list[ImportRow]
    foundCount: int
    newCount: int
    errorCount: int


class GlobalAttendanceImportPreview(BaseModel):
    groups: list[SessionImportGroup]
    totalRows: int
    totalErrors: int
    missingSessions: int


class SessionImportGroupConfirm(BaseModel):
    dateKey: str
    heureKey: str
    sessionId: str | None = None
    createSession: bool = False
    sessionTitle: str | None = None
    rows: list[ConfirmImportRow]


class GlobalAttendanceImportConfirmBody(BaseModel):
    groups: list[SessionImportGroupConfirm]


class GlobalImportSummary(BaseModel):
    sessionsCreated: int
    sessionsUpdated: int
    attendancesSet: int
    membersCreated: int


class ModuleEntry(BaseModel):
    moduleRef: str
    moduleLabel: str
    accessKind: Literal["ponctuelle_module", "reconversion_module", "reconversion_pack"]


class ModuleAccessInfo(BaseModel):
    id: str
    moduleRef: str
    moduleLabel: str
    accessKind: str


class ModuleSessionSummary(BaseModel):
    id: str
    groupId: str
    sessionLabel: str
    accesses: list[ModuleAccessInfo]
    memberCount: int
    sessionCount: int
    pendingSessionCount: int


class ModuleSessionMemberDto(BaseModel):
    id: str
    email: str
    firstName: str | None = None
    lastName: str | None = None
    fullName: str
    status: MemberStatus
    attendanceRate: int


class ActiveEnrollmentDto(BaseModel):
    memberId: str
    email: str
    fullName: str
    moduleRef: str
    moduleLabel: str
    accessKind: str
    formationType: str  # ex: "Reconversion IA" ou "Ponctuelle"
    attendanceRate: int


class ModuleSessionCreateBody(BaseModel):
    modules: list[ModuleEntry]
    sessionLabel: str
    packSessionModuleRef: str | None = Field(
        None,
        max_length=300,
        description="Module du pack concerné par la session (reconversion_pack).",
    )


class AddMemberToSessionBody(BaseModel):
    email: EmailStr


class ModuleSessionListResponse(BaseModel):
    items: list[ModuleSessionSummary]


class ModuleSessionMembersResponse(BaseModel):
    items: list[ModuleSessionMemberDto]


class ActiveEnrollmentsResponse(BaseModel):
    items: list[ActiveEnrollmentDto]


class ModuleSessionMutationResponse(BaseModel):
    session: ModuleSessionSummary


class EnrollmentCreateBody(BaseModel):
    email: EmailStr
    enrollmentKind: str
    targetRef: str
    targetLabel: str
