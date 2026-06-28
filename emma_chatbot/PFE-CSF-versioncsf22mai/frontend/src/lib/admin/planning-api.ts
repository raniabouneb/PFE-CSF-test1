const PROXY = "/api/admin/backend/planning"

export type ScheduledSession = {
  id: string
  groupId: string
  title: string
  groupLabel: string
  targetLabel?: string | null
  scheduledAt: string
  dateISO: string
  startTime: string
  endTime: string
  durationMinutes: number
  status: "planned" | "completed" | "cancelled" | string
}

export type ReminderRule = {
  id: string
  label: string
  enabled: boolean
  hoursBefore: number
  channels: { email: boolean; sms: boolean }
}

export type BrainReminderState = {
  rules: ReminderRule[]
}

export type DailyNotificationDigest = {
  dateISO: string
  expectedRuns: number
  completedRuns: number
  failedRuns: number
}

export type PlanningOverviewPayload = {
  dateISO: string
  sessions: ScheduledSession[]
  rules: ReminderRule[]
  digest: DailyNotificationDigest
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown; error?: unknown }
    if (typeof data.detail === "string") return data.detail
    if (typeof data.error === "string") return data.error
  } catch {
    // ignore
  }
  return `Erreur ${res.status}`
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as T
}

export async function fetchPlanningOverview(params: {
  startDate: string
  endDate: string
  date: string
}): Promise<PlanningOverviewPayload> {
  const search = new URLSearchParams(params)
  const res = await fetch(`${PROXY}?${search.toString()}`, {
    credentials: "include",
    cache: "no-store",
  })
  return readJson<PlanningOverviewPayload>(res)
}

export async function savePlanningReminderRules(rules: ReminderRule[]): Promise<ReminderRule[]> {
  const res = await fetch(`${PROXY}/reminders`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rules }),
  })
  const data = await readJson<{ rules: ReminderRule[] }>(res)
  return data.rules
}

export async function patchPlanningSession(
  sessionId: string,
  body: Record<string, unknown>,
): Promise<ScheduledSession> {
  const res = await fetch(`${PROXY}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return readJson<ScheduledSession>(res)
}

export async function deletePlanningSession(sessionId: string): Promise<void> {
  const res = await fetch(`${PROXY}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    credentials: "include",
  })
  await readJson<{ ok: boolean }>(res)
}

// ── Multi-group sessions ─────────────────────────────────────────────

export type MultiSessionGroup = {
  id: number
  name: string
  format: "ponctuelle" | "reconversion" | string
  member_count: number
}

export type MultiSession = {
  id: number
  title: string
  module_target_ref: string | null
  module_label: string | null
  date: string
  start_time: string | null
  duration_minutes: number
  location: string | null
  status: "planned" | "completed" | "cancelled"
  groups: MultiSessionGroup[]
  created_at: string | null
}

export type MultiSessionAttendee = {
  member_id: number
  email: string
  first_name: string | null
  last_name: string | null
  group_name: string
  group_format: "ponctuelle" | "reconversion" | string
  present: boolean | null
}

export type MultiSessionCreateBody = {
  title: string
  module_target_ref?: string | null
  module_label?: string | null
  date: string
  start_time?: string | null
  duration_minutes: number
  location?: string | null
  group_ids: number[]
}

export type MultiSessionPatchBody = {
  title?: string | null
  date?: string | null
  start_time?: string | null
  duration_minutes?: number | null
  location?: string | null
  status?: string | null
}

export async function fetchMultiSessions(params?: {
  date_from?: string
  date_to?: string
}): Promise<MultiSession[]> {
  const sp = new URLSearchParams()
  if (params?.date_from) sp.set("date_from", params.date_from)
  if (params?.date_to) sp.set("date_to", params.date_to)
  const qs = sp.toString()
  const res = await fetch(`${PROXY}/multi-sessions${qs ? `?${qs}` : ""}`, {
    credentials: "include",
    cache: "no-store",
  })
  return readJson<MultiSession[]>(res)
}

export const DEFAULT_PLANNING_LOCATION = "Google Meet"

export type ScheduleModuleSessionInput = {
  groupId: number
  moduleTargetRef: string
  moduleLabel: string
  title: string
  date: string
  startTime: string
  durationMinutes: number
  location?: string
}

/** Planifie une séance pour une session-module (apprenants + présences pending + Google Calendar). */
export async function scheduleModuleSession(input: ScheduleModuleSessionInput): Promise<MultiSession> {
  return createMultiSession({
    title: input.title,
    module_target_ref: input.moduleTargetRef,
    module_label: input.moduleLabel,
    date: input.date,
    start_time: input.startTime,
    duration_minutes: input.durationMinutes,
    location: input.location?.trim() || DEFAULT_PLANNING_LOCATION,
    group_ids: [input.groupId],
  })
}

export async function createMultiSession(body: MultiSessionCreateBody): Promise<MultiSession> {
  const res = await fetch(`${PROXY}/multi-sessions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return readJson<MultiSession>(res)
}

export async function patchMultiSession(id: number, body: MultiSessionPatchBody): Promise<MultiSession> {
  const res = await fetch(`${PROXY}/multi-sessions/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return readJson<MultiSession>(res)
}

export async function deleteMultiSession(id: number): Promise<void> {
  const res = await fetch(`${PROXY}/multi-sessions/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  await readJson<{ ok: boolean }>(res)
}

export async function addGroupToMultiSession(sessionId: number, groupId: number): Promise<MultiSession> {
  const res = await fetch(`${PROXY}/multi-sessions/${sessionId}/groups`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group_id: groupId }),
  })
  return readJson<MultiSession>(res)
}

export async function removeGroupFromMultiSession(sessionId: number, groupId: number): Promise<MultiSession> {
  const res = await fetch(`${PROXY}/multi-sessions/${sessionId}/groups/${groupId}`, {
    method: "DELETE",
    credentials: "include",
  })
  return readJson<MultiSession>(res)
}

export async function fetchMultiSessionAttendees(sessionId: number): Promise<MultiSessionAttendee[]> {
  const res = await fetch(`${PROXY}/multi-sessions/${sessionId}/attendees`, {
    credentials: "include",
    cache: "no-store",
  })
  return readJson<MultiSessionAttendee[]>(res)
}

export async function saveMultiSessionAttendance(
  sessionId: number,
  records: { member_id: number; present: boolean }[],
): Promise<void> {
  const res = await fetch(`${PROXY}/multi-sessions/${sessionId}/attendance`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  })
  await readJson<{ ok: boolean }>(res)
}

export async function fetchActiveGroups(): Promise<MultiSessionGroup[]> {
  const res = await fetch(`${PROXY}/multi-sessions/groups`, {
    credentials: "include",
    cache: "no-store",
  })
  return readJson<MultiSessionGroup[]>(res)
}

export type ModuleOption = {
  id: number
  title: string
  ref: string
}

export type AvailableModules = {
  ponctuelle: ModuleOption[]
  reconversion: ModuleOption[]
}

export async function fetchAvailableModules(): Promise<AvailableModules> {
  const res = await fetch(`${PROXY}/multi-sessions/modules`, {
    credentials: "include",
    cache: "no-store",
  })
  return readJson<AvailableModules>(res)
}

export async function unlockModule(memberId: number, targetRef: string): Promise<void> {
  const res = await fetch(`${PROXY}/multi-sessions/unlock-module`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ member_id: memberId, target_ref: targetRef }),
  })
  await readJson<{ ok: boolean }>(res)
}

// ── Google Calendar ──────────────────────────────────────────────────

export type GCalStatus = {
  connected: boolean
  configured: boolean
  calendarId?: string | null
  embedUrl?: string | null
  openUrl?: string | null
  /** URI à copier dans Google Cloud Console → Authorized redirect URIs */
  redirectUri?: string | null
}

const GCAL_EMBED_TZ = "Europe/Paris"

export function buildGoogleCalendarEmbedUrl(calendarId: string): string {
  const src = encodeURIComponent(calendarId)
  const ctz = encodeURIComponent(GCAL_EMBED_TZ)
  return (
    "https://calendar.google.com/calendar/embed" +
    `?src=${src}&ctz=${ctz}&hl=fr&mode=MONTH` +
    "&showTitle=1&showNav=1&showDate=1&showPrint=1&showTabs=1" +
    "&showCalendars=1&showTz=1&wkst=2"
  )
}

function normalizeGCalStatus(raw: Record<string, unknown>): GCalStatus {
  const connected = Boolean(raw.connected)
  const configured = raw.configured !== false
  const calendarId =
    (typeof raw.calendarId === "string" ? raw.calendarId : null) ??
    (typeof raw.calendar_id === "string" ? raw.calendar_id : null) ??
    null
  let embedUrl =
    (typeof raw.embedUrl === "string" ? raw.embedUrl : null) ??
    (typeof raw.embed_url === "string" ? raw.embed_url : null) ??
    null
  const openUrl =
    (typeof raw.openUrl === "string" ? raw.openUrl : null) ??
    (typeof raw.open_url === "string" ? raw.open_url : null) ??
    "https://calendar.google.com/calendar/r"

  if (connected && !embedUrl && calendarId) {
    embedUrl = buildGoogleCalendarEmbedUrl(calendarId)
  }

  const redirectUri =
    (typeof raw.redirectUri === "string" ? raw.redirectUri : null) ??
    (typeof raw.redirect_uri === "string" ? raw.redirect_uri : null) ??
    null

  return { connected, configured, calendarId, embedUrl, openUrl, redirectUri }
}

/** URL iframe : API ou repli local si `embedUrl` absent mais connecté. */
export function resolveGCalEmbedUrl(status: GCalStatus): string | null {
  if (status.embedUrl) return status.embedUrl
  if (status.connected && status.calendarId) {
    return buildGoogleCalendarEmbedUrl(status.calendarId)
  }
  return null
}

export async function fetchGCalStatus(): Promise<GCalStatus> {
  const res = await fetch(`${PROXY}/gcal/status`, {
    credentials: "include",
    cache: "no-store",
  })
  const raw = await readJson<Record<string, unknown>>(res)
  return normalizeGCalStatus(raw)
}

export async function fetchGCalAuthUrl(): Promise<string> {
  const res = await fetch(`${PROXY}/gcal/auth-url`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await readJson<{ url: string }>(res)
  return data.url
}

export async function disconnectGCal(): Promise<void> {
  const res = await fetch(`${PROXY}/gcal/disconnect`, {
    method: "DELETE",
    credentials: "include",
  })
  await readJson<{ ok: boolean }>(res)
}

export type GCalEventItem = {
  id: string
  summary: string
  date: string
  startTime: string
  durationMinutes: number
  location: string | null
  htmlLink: string | null
  alreadyLinked: boolean
}

export async function fetchGCalEvents(params?: {
  days_back?: number
  days_forward?: number
}): Promise<GCalEventItem[]> {
  const sp = new URLSearchParams()
  if (params?.days_back != null) sp.set("days_back", String(params.days_back))
  if (params?.days_forward != null) sp.set("days_forward", String(params.days_forward))
  const qs = sp.toString()
  const res = await fetch(`${PROXY}/gcal/events${qs ? `?${qs}` : ""}`, {
    credentials: "include",
    cache: "no-store",
  })
  const data = await readJson<{ items: GCalEventItem[] }>(res)
  return data.items
}

export type ImportGoogleEventInput = {
  googleEventId: string
  groupId: number
  moduleTargetRef: string
  moduleLabel: string
}

export async function importGoogleEventToModuleSession(
  input: ImportGoogleEventInput,
): Promise<MultiSession> {
  const res = await fetch(`${PROXY}/multi-sessions/from-google-event`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      google_event_id: input.googleEventId,
      group_id: input.groupId,
      module_target_ref: input.moduleTargetRef,
      module_label: input.moduleLabel,
    }),
  })
  return readJson<MultiSession>(res)
}

export type AutoLinkGoogleResult = {
  linked: boolean
  candidateCount?: number
  candidates?: GCalEventItem[]
  message?: string
  session?: MultiSession
}

/** Détecte un événement Google récent et l’enregistre dans CSF. */
export async function autoLinkGoogleEventToModuleSession(input: {
  groupId: number
  moduleTargetRef: string
  moduleLabel: string
  sinceIso: string
  sessionLabel?: string
  googleEventId?: string
}): Promise<AutoLinkGoogleResult> {
  const res = await fetch(`${PROXY}/gcal/auto-link`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group_id: input.groupId,
      module_target_ref: input.moduleTargetRef,
      module_label: input.moduleLabel,
      since: input.sinceIso,
      session_label: input.sessionLabel ?? null,
      google_event_id: input.googleEventId ?? null,
    }),
  })
  return readJson<AutoLinkGoogleResult>(res)
}
