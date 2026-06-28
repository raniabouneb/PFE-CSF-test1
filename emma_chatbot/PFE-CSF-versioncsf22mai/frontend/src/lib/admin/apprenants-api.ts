const PROXY = "/api/admin/backend/apprenants"

export type ApprenantFormat = "reconversion" | "ponctuelle" | "sur_mesure"
export type ApprenantGroupStatus = "pending" | "active" | "terminee" | "suspendue"
export type MemberStatus = "pending" | "linked" | "active" | "archived"
export type AccessKind =
  | "reconversion_topic"
  | "reconversion_pack"
  | "ponctuelle_formation"
  | "reconversion_module"
  | "ponctuelle_module"
export type AttendanceStatus = "present" | "absent" | "excused" | "pending"
export type ImportRowResolution = "found" | "new" | "error"

export type ImportRow = {
  rowIndex: number
  date?: string | null
  heure?: string | null
  email: string
  statut?: AttendanceStatus | null
  resolution: ImportRowResolution
  errorMessage?: string | null
}

export type AttendanceImportPreview = {
  rows: ImportRow[]
  foundCount: number
  newCount: number
  errorCount: number
}

export type ConfirmImportRow = {
  email: string
  statut: AttendanceStatus
  createIfNew: boolean
}
export type ProgressStatus = "not_started" | "in_progress" | "completed"
export type CertificationStatus = "pending" | "passed" | "failed" | "available" | "locked" | "unlocked"
export type NoteType = "info" | "warning" | "success"

export type FilterOption = { id: string; label: string }
export type ReconversionPackOption = {
  id: string
  label: string
  topicSlug: string
  variantSlug: string
  packKind: string
}

export type ApprenantKpis = {
  groups: number
  members: number
  averageProgress: number
}

export type ApprenantFiltersPayload = {
  formats: FilterOption[]
  reconversionTopics: FilterOption[]
  reconversionPacks: ReconversionPackOption[]
  ponctuelleFormations: FilterOption[]
  kpis: ApprenantKpis
}

export type GroupSummaryDto = {
  id: string
  name: string
  description?: string | null
  formationLabel: string
  format: ApprenantFormat
  status: ApprenantGroupStatus
  startDate?: string | null
  endDate?: string | null
  reconversionTopicSlug?: string | null
  reconversionTopicLabel?: string | null
  reconversionPackId?: string | null
  reconversionPackLabel?: string | null
  ponctuelleFormationSlug?: string | null
  ponctuelleFormationLabel?: string | null
  ponctuelleFormationSlugs: string[]
  ponctuelleFormationLabels: string[]
  memberCount: number
  progressAverage: number
  accessCount: number
}

export type GroupMemberDto = {
  id: string
  groupId: string
  userId?: string | null
  email: string
  firstName?: string | null
  lastName?: string | null
  fullName: string
  status: MemberStatus
  pointsTotal: number
  linkedAt?: string | null
  attendanceRate: number
  progressAverage: number
  notesCount: number
}

export type GroupAccessDto = {
  id: string
  groupId: string
  accessKind: AccessKind
  targetRef: string
  label: string
  kindLabel: string
  targetLabel: string
  formationLabel?: string | null
}

export type AttendanceItemDto = {
  memberId: string
  status: AttendanceStatus
  note?: string | null
}

export type AttendanceSummaryDto = {
  total: number
  present: number
  absent: number
  excused: number
  pending: number
}

export type GroupSessionDto = {
  id: string
  groupId: string
  accessId?: string | null
  targetRef?: string | null
  targetKind?: string | null
  targetLabel?: string | null
  title: string
  scheduledAt: string
  durationMinutes: number
  status: "planned" | "completed" | "cancelled"
  notes?: string | null
  attendanceSummary: AttendanceSummaryDto
  attendance: AttendanceItemDto[]
}

export type MemberProgressDto = {
  id: string
  memberId: string
  accessKind: string
  targetRef: string
  title: string
  progressPercent: number
  status: ProgressStatus
  scorePercent?: number | null
  currentFlag: boolean
  locked: boolean
  openedByAdmin: boolean
  completedByAdmin: boolean
  progressMode: string
  minutesCompleted: number
  minutesTotal?: number | null
  note?: string | null
  updatedAt?: string | null
}

export type MemberCertificationDto = {
  id: string
  memberId: string
  title: string
  scopeRef?: string | null
  scorePercent?: number | null
  status: CertificationStatus
  issuer?: string | null
  awardedAt?: string | null
}

export type MemberNoteDto = {
  id: string
  memberId: string
  authorName: string
  noteType: NoteType
  content: string
  createdAt: string
}

export type MemberHistoryDto = {
  id: string
  date: string
  action: string
  details: string
  type: "formation" | "evaluation" | "presence" | "points" | "note"
}

export type GroupDetailDto = {
  group: GroupSummaryDto
  members: GroupMemberDto[]
  accesses: GroupAccessDto[]
  sessions: GroupSessionDto[]
}

export type MemberProfileDto = {
  member: GroupMemberDto
  group: GroupSummaryDto
  accesses: GroupAccessDto[]
  progress: MemberProgressDto[]
  certifications: MemberCertificationDto[]
  notes: MemberNoteDto[]
  history: MemberHistoryDto[]
  learnerCv?: Record<string, unknown> | null
}

export type MemberAttendanceHistoryItem = {
  sessionId: string
  sessionTitle: string
  scheduledAt: string
  targetLabel?: string | null
  status: AttendanceStatus
}

export type MemberAttendanceHistory = {
  items: MemberAttendanceHistoryItem[]
  attendanceRate: number
}

export type ModuleAccessInfo = {
  id: string
  moduleRef: string
  moduleLabel: string
  accessKind: "ponctuelle_module" | "reconversion_module" | "reconversion_pack"
}

export type ModuleSessionSummary = {
  id: string
  groupId: string
  sessionLabel: string
  accesses: ModuleAccessInfo[]
  memberCount: number
  sessionCount: number
  pendingSessionCount: number
}

export type ActiveEnrollmentDto = {
  memberId: string
  email: string
  fullName: string
  moduleRef: string
  moduleLabel: string
  accessKind: string
  formationType: string
  attendanceRate: number
}

export type ModuleSessionCreateBody = {
  modules: { moduleRef: string; moduleLabel: string; accessKind: string }[]
  sessionLabel: string
  /** Module du pack à débloquer lors de la première séance (reconversion_pack). */
  packSessionModuleRef?: string | null
}

export type PackModuleOption = {
  targetRef: string
  title: string
  accessKind: string
}

export type AvailableModule = {
  id: number
  title: string
  ref: string
  kind: "ponctuelle_module" | "reconversion_module"
}

export type ModuleSessionMemberDto = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  fullName: string
  status: MemberStatus
  attendanceRate: number
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown; error?: unknown }
    if (typeof j.detail === "string") return j.detail
    if (typeof j.error === "string") return j.error
  } catch {
    // ignore
  }
  return `Erreur ${res.status}`
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as T
}

export async function fetchApprenantFilters(): Promise<ApprenantFiltersPayload> {
  const res = await fetch(`${PROXY}/filters`, { credentials: "include", cache: "no-store" })
  return readJson<ApprenantFiltersPayload>(res)
}

export async function fetchApprenantGroups(params?: {
  format?: string
  reconversionTopicSlug?: string
  ponctuelleFormationSlug?: string
  reconversionPackId?: string
}): Promise<GroupSummaryDto[]> {
  const sp = new URLSearchParams()
  if (params?.format && params.format !== "all") sp.set("format", params.format)
  if (params?.reconversionTopicSlug && params.reconversionTopicSlug !== "all") {
    sp.set("reconversionTopicSlug", params.reconversionTopicSlug)
  }
  if (params?.ponctuelleFormationSlug && params.ponctuelleFormationSlug !== "all") {
    sp.set("ponctuelleFormationSlug", params.ponctuelleFormationSlug)
  }
  if (params?.reconversionPackId && params.reconversionPackId !== "all") {
    sp.set("reconversionPackId", params.reconversionPackId)
  }
  const res = await fetch(`${PROXY}/groups?${sp.toString()}`, { credentials: "include", cache: "no-store" })
  const data = await readJson<{ items: GroupSummaryDto[] }>(res)
  return data.items
}

export async function createApprenantGroup(body: Record<string, unknown>): Promise<GroupSummaryDto> {
  const res = await fetch(`${PROXY}/groups`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await readJson<{ group: GroupSummaryDto }>(res)
  return data.group
}

export async function patchApprenantGroup(groupId: string, body: Record<string, unknown>): Promise<GroupSummaryDto> {
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await readJson<{ group: GroupSummaryDto }>(res)
  return data.group
}

export async function deleteApprenantGroup(groupId: string): Promise<void> {
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}`, {
    method: "DELETE",
    credentials: "include",
  })
  await readJson<{ ok: boolean }>(res)
}

export async function fetchGroupDetail(groupId: string): Promise<GroupDetailDto> {
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await readJson<{ data: GroupDetailDto }>(res)
  return data.data
}

export async function createGroupMember(groupId: string, body: Record<string, unknown>): Promise<GroupMemberDto> {
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}/members`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await readJson<{ member: GroupMemberDto }>(res)
  return data.member
}

export async function patchGroupMember(
  groupId: string,
  memberId: string,
  body: Record<string, unknown>,
): Promise<GroupMemberDto> {
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await readJson<{ member: GroupMemberDto }>(res)
  return data.member
}

export async function deleteGroupMember(groupId: string, memberId: string): Promise<void> {
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`, {
    method: "DELETE",
    credentials: "include",
  })
  await readJson<{ ok: boolean }>(res)
}

export async function createGroupAccess(groupId: string, body: Record<string, unknown>): Promise<GroupAccessDto> {
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}/access`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await readJson<{ access: GroupAccessDto }>(res)
  return data.access
}

export async function deleteGroupAccess(groupId: string, accessId: string): Promise<void> {
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}/access/${encodeURIComponent(accessId)}`, {
    method: "DELETE",
    credentials: "include",
  })
  await readJson<{ ok: boolean }>(res)
}

export async function createGroupSession(groupId: string, body: Record<string, unknown>): Promise<GroupSessionDto> {
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}/sessions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await readJson<{ session: GroupSessionDto }>(res)
  return data.session
}

export async function patchGroupSession(
  sessionId: string,
  body: Record<string, unknown>,
): Promise<GroupSessionDto> {
  const res = await fetch(`${PROXY}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await readJson<{ session: GroupSessionDto }>(res)
  return data.session
}

export async function deleteGroupSession(sessionId: string): Promise<void> {
  const res = await fetch(`${PROXY}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    credentials: "include",
  })
  await readJson<{ ok: boolean }>(res)
}

export async function patchSessionAttendance(
  sessionId: string,
  items: { memberId: string; status: AttendanceStatus; note?: string | null }[],
): Promise<GroupSessionDto> {
  const res = await fetch(`${PROXY}/sessions/${encodeURIComponent(sessionId)}/attendance`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  })
  const data = await readJson<{ session: GroupSessionDto }>(res)
  return data.session
}

export async function importAttendancePreview(sessionId: string, file: File): Promise<AttendanceImportPreview> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${PROXY}/sessions/${encodeURIComponent(sessionId)}/attendance/import`, {
    method: "POST",
    credentials: "include",
    body: formData,
  })
  return readJson<AttendanceImportPreview>(res)
}

export async function confirmAttendanceImport(
  sessionId: string,
  rows: ConfirmImportRow[],
): Promise<GroupSessionDto> {
  const res = await fetch(`${PROXY}/sessions/${encodeURIComponent(sessionId)}/attendance/import/confirm`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  })
  const data = await readJson<{ session: GroupSessionDto }>(res)
  return data.session
}

export type SessionImportGroup = {
  dateKey: string
  heureKey: string
  sessionId?: string | null
  sessionTitle?: string | null
  sessionResolution: "found" | "missing"
  rows: ImportRow[]
  foundCount: number
  newCount: number
  errorCount: number
}

export type GlobalAttendanceImportPreview = {
  groups: SessionImportGroup[]
  totalRows: number
  totalErrors: number
  missingSessions: number
}

export type SessionImportGroupConfirm = {
  dateKey: string
  heureKey: string
  sessionId?: string | null
  createSession: boolean
  sessionTitle?: string | null
  rows: ConfirmImportRow[]
}

export type GlobalImportSummary = {
  sessionsCreated: number
  sessionsUpdated: number
  attendancesSet: number
  membersCreated: number
}

export async function globalImportAttendancePreview(
  groupId: string,
  file: File,
): Promise<GlobalAttendanceImportPreview> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}/attendance/import`, {
    method: "POST",
    credentials: "include",
    body: formData,
  })
  return readJson<GlobalAttendanceImportPreview>(res)
}

export async function globalConfirmAttendanceImport(
  groupId: string,
  groups: SessionImportGroupConfirm[],
): Promise<GlobalImportSummary> {
  const res = await fetch(`${PROXY}/groups/${encodeURIComponent(groupId)}/attendance/import/confirm`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groups }),
  })
  return readJson<GlobalImportSummary>(res)
}

export async function fetchMemberProfile(memberId: string): Promise<MemberProfileDto> {
  const res = await fetch(`${PROXY}/members/${encodeURIComponent(memberId)}`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await readJson<{ data: MemberProfileDto }>(res)
  return data.data
}

export async function fetchMemberAttendanceHistory(memberId: string): Promise<MemberAttendanceHistory> {
  const res = await fetch(`${PROXY}/members/${encodeURIComponent(memberId)}/attendance-history`, {
    credentials: "include",
    cache: "no-store",
  })
  return readJson<MemberAttendanceHistory>(res)
}

export async function patchMemberProgress(
  memberId: string,
  items: Record<string, unknown>[],
): Promise<MemberProgressDto[]> {
  const res = await fetch(`${PROXY}/members/${encodeURIComponent(memberId)}/progress`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  })
  const data = await readJson<{ items: MemberProgressDto[] }>(res)
  return data.items
}

export async function patchMemberCertifications(
  memberId: string,
  items: Record<string, unknown>[],
): Promise<MemberCertificationDto[]> {
  const res = await fetch(`${PROXY}/members/${encodeURIComponent(memberId)}/certifications`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  })
  const data = await readJson<{ items: MemberCertificationDto[] }>(res)
  return data.items
}

export async function createMemberNote(
  memberId: string,
  body: { noteType: NoteType; content: string },
): Promise<MemberNoteDto> {
  const res = await fetch(`${PROXY}/members/${encodeURIComponent(memberId)}/notes`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await readJson<{ note: MemberNoteDto }>(res)
  return data.note
}

export async function fetchAvailableModules(): Promise<AvailableModule[]> {
  const res = await fetch("/api/admin/backend/planning/multi-sessions/modules", {
    credentials: "include",
    cache: "no-store",
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as {
    ponctuelle: { id: number; title: string; ref: string }[]
    reconversion: { id: number; title: string; ref: string }[]
  }
  return [
    ...data.ponctuelle.map((m) => ({
      id: m.id,
      title: m.title,
      ref: m.ref || `ponctuelle_module:${m.id}`,
      kind: "ponctuelle_module" as const,
    })),
    ...data.reconversion.map((m) => ({
      id: m.id,
      title: m.title,
      ref: m.ref || `reconversion_pack_module:${m.id}`,
      kind: "reconversion_module" as const,
    })),
  ]
}

export async function fetchModuleSessions(): Promise<ModuleSessionSummary[]> {
  const res = await fetch(`${PROXY}/module-sessions`, { credentials: "include", cache: "no-store" })
  const data = await readJson<{ items: ModuleSessionSummary[] }>(res)
  return data.items
}

export async function createModuleSession(body: ModuleSessionCreateBody): Promise<ModuleSessionSummary> {
  const res = await fetch(`${PROXY}/module-sessions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await readJson<{ session: ModuleSessionSummary }>(res)
  return data.session
}

export async function fetchActiveEnrollments(params?: {
  access_kind?: string
  target_ref?: string
}): Promise<ActiveEnrollmentDto[]> {
  const sp = new URLSearchParams()
  if (params?.access_kind) sp.set("access_kind", params.access_kind)
  if (params?.target_ref) sp.set("target_ref", params.target_ref)
  const qs = sp.toString()
  const res = await fetch(`${PROXY}/active-enrollments${qs ? `?${qs}` : ""}`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await readJson<{ items: ActiveEnrollmentDto[] }>(res)
  return data.items
}

export async function fetchModuleSessionMembers(groupId: string): Promise<ModuleSessionMemberDto[]> {
  const res = await fetch(`${PROXY}/module-sessions/${encodeURIComponent(groupId)}/members`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await readJson<{ items: ModuleSessionMemberDto[] }>(res)
  return data.items
}

export async function addMemberToModuleSession(groupId: string, email: string): Promise<ModuleSessionSummary> {
  const res = await fetch(`${PROXY}/module-sessions/${encodeURIComponent(groupId)}/members`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  const data = await readJson<{ session: ModuleSessionSummary }>(res)
  return data.session
}

export async function removeMemberFromModuleSession(groupId: string, memberId: string): Promise<void> {
  const res = await fetch(
    `${PROXY}/module-sessions/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`,
    { method: "DELETE", credentials: "include" },
  )
  await readJson<{ ok: boolean }>(res)
}

export async function deleteModuleSession(groupId: string): Promise<void> {
  const res = await fetch(`${PROXY}/module-sessions/${encodeURIComponent(groupId)}`, {
    method: "DELETE",
    credentials: "include",
  })
  await readJson<{ ok: boolean }>(res)
}

export type EnrollmentDto = {
  id: string
  email: string
  emailNormalized: string
  userId?: string | null
  enrollmentKind: "reconversion_pack" | "reconversion_module" | "ponctuelle_module"
  targetRef: string
  targetLabel: string
  status: "active" | "archived"
  sessionCount: number
  attendanceRate: number
  createdAt: string
}

export type EnrolledMemberForTarget = {
  enrollmentId: string
  email: string
  emailNormalized: string
  fullName: string
  userId?: string | null
  attendanceRate: number
}

export type EnrollmentCreateBody = {
  email: string
  enrollmentKind: "reconversion_pack" | "reconversion_module" | "ponctuelle_module"
  targetRef: string
  targetLabel: string
}

export async function fetchEnrollments(params?: {
  enrollment_kind?: string
  target_ref?: string
}): Promise<EnrollmentDto[]> {
  const sp = new URLSearchParams()
  if (params?.enrollment_kind) sp.set("enrollment_kind", params.enrollment_kind)
  if (params?.target_ref) sp.set("target_ref", params.target_ref)
  const qs = sp.toString()
  const res = await fetch(`${PROXY}/enrollments${qs ? `?${qs}` : ""}`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await readJson<{ items: EnrollmentDto[] }>(res)
  return data.items
}

export async function createEnrollment(body: EnrollmentCreateBody): Promise<EnrollmentDto> {
  const res = await fetch(`${PROXY}/enrollments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return readJson<EnrollmentDto>(res)
}

export async function deleteEnrollment(enrollmentId: string): Promise<void> {
  const res = await fetch(`${PROXY}/enrollments/${encodeURIComponent(enrollmentId)}`, {
    method: "DELETE",
    credentials: "include",
  })
  await readJson<{ ok: boolean }>(res)
}

export async function fetchEnrolledMembersForTarget(
  enrollmentKind: string,
  targetRef: string,
): Promise<EnrolledMemberForTarget[]> {
  const sp = new URLSearchParams({ enrollment_kind: enrollmentKind, target_ref: targetRef })
  const res = await fetch(`${PROXY}/enrollments/members-for-target?${sp.toString()}`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await readJson<{ items: EnrolledMemberForTarget[] }>(res)
  return data.items
}

export async function fetchPackModules(packId: string): Promise<PackModuleOption[]> {
  const sp = new URLSearchParams({ pack_id: packId })
  const res = await fetch(`${PROXY}/enrollments/pack-modules?${sp.toString()}`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await readJson<{ items: PackModuleOption[] }>(res)
  return data.items
}
