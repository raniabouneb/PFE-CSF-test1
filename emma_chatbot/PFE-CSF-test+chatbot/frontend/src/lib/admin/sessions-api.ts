const PROXY = "/api/admin/backend/sessions"

export type GroupeRef = {
  id: string
  nom: string
  type: "ponctuelle" | "reconversion"
  statut: string
}

export type ModuleRef = {
  id: string
  titre: string
  duree_minutes: number | null
}

export type SessionDto = {
  id: string
  module_id: string | null
  titre: string
  date: string
  heure_debut: string | null
  duree_minutes: number | null
  lieu: string | null
  statut: string
  created_at: string | null
  module: ModuleRef | null
  groupes: GroupeRef[]
}

export type AttendanceEntry = {
  apprenant_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  enrollment_type: string
  present: boolean
  marked_at: string | null
}

export type SessionCreateBody = {
  module_id?: string | null
  titre: string
  date: string
  heure_debut?: string | null
  duree_minutes?: number | null
  lieu?: string | null
  group_ids: string[]
}

export async function fetchSessions(params?: {
  date_from?: string
  date_to?: string
  groupe_id?: string
}): Promise<SessionDto[]> {
  const qs = new URLSearchParams()
  if (params?.date_from) qs.set("date_from", params.date_from)
  if (params?.date_to) qs.set("date_to", params.date_to)
  if (params?.groupe_id) qs.set("groupe_id", params.groupe_id)
  const q = qs.toString()
  const res = await fetch(`${PROXY}/${q ? `?${q}` : ""}`)
  if (!res.ok) throw new Error("Erreur chargement séances")
  return res.json()
}

export async function createSession(body: SessionCreateBody): Promise<SessionDto> {
  const res = await fetch(`${PROXY}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Erreur création séance")
  return res.json()
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`${PROXY}/${sessionId}`, { method: "DELETE" })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail ?? "Erreur suppression")
  }
}

export async function fetchAttendance(sessionId: string): Promise<AttendanceEntry[]> {
  const res = await fetch(`${PROXY}/${sessionId}/attendance`)
  if (!res.ok) throw new Error("Erreur chargement présences")
  return res.json()
}

export async function saveAttendance(
  sessionId: string,
  entries: { apprenant_id: string; present: boolean }[],
): Promise<AttendanceEntry[]> {
  const res = await fetch(`${PROXY}/${sessionId}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entries),
  })
  if (!res.ok) throw new Error("Erreur enregistrement présences")
  return res.json()
}

export async function fetchAllGroupes(): Promise<GroupeRef[]> {
  const res = await fetch("/api/admin/backend/sessions/?_groups_only=1")
  if (res.ok) {
    const sessions: SessionDto[] = await res.json()
    const map = new Map<string, GroupeRef>()
    for (const s of sessions) for (const g of s.groupes) map.set(g.id, g)
    return [...map.values()]
  }
  return []
}
