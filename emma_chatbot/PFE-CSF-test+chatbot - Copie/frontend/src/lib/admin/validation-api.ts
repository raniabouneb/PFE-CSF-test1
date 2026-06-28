const PROXY = "/api/admin/backend/validation"

export type ValidationDocKind = "certificate" | "recommendation"
export type ValidationDocStatus = "pending_admin" | "validated" | "rejected"
export type SystemResult = "success" | "failure"

export type AbsenceSession = {
  session_id: number
  title: string
  scheduled_at: string | null
}

export type ValidationQueueItem = {
  id: number
  memberId: number
  memberName: string
  memberEmail: string
  groupId: number
  groupName: string
  kind: ValidationDocKind
  scopeRef: string
  scopeLabel: string
  presencePercent: number
  absenceCount: number
  absenceSessions: AbsenceSession[]
  testScorePercent: number | null
  systemResult: SystemResult
  systemReason: string
  status: ValidationDocStatus
  submittedAt: string | null
}

export type ValidationStats = {
  pending_count: number
  validated_this_month: number
  rejected_this_month: number
}

const KIND_LABELS: Record<ValidationDocKind, string> = {
  certificate: "Certificat",
  recommendation: "Lettre de recommandation",
}

export function labelValidationKind(kind: ValidationDocKind): string {
  return KIND_LABELS[kind]
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

export async function fetchValidationQueue(): Promise<ValidationQueueItem[]> {
  const res = await fetch(`${PROXY}/queue`, { credentials: "include", cache: "no-store" })
  const data = await readJson<{ items: ValidationQueueItem[] }>(res)
  return data.items
}

export async function fetchValidationStats(): Promise<ValidationStats> {
  const res = await fetch(`${PROXY}/stats`, { credentials: "include", cache: "no-store" })
  return readJson<ValidationStats>(res)
}

export async function validateDocument(docId: number): Promise<{ ok: boolean; pdfPath: string | null }> {
  const res = await fetch(`${PROXY}/queue/${docId}/validate`, {
    method: "POST",
    credentials: "include",
  })
  return readJson<{ ok: boolean; pdfPath: string | null }>(res)
}

export async function rejectDocument(docId: number, reason: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${PROXY}/queue/${docId}/reject`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rejection_reason: reason }),
  })
  return readJson<{ ok: boolean }>(res)
}

export async function recalculateDocument(docId: number): Promise<ValidationQueueItem> {
  const res = await fetch(`${PROXY}/queue/${docId}/recalculate`, {
    method: "POST",
    credentials: "include",
  })
  const data = await readJson<{ data: ValidationQueueItem }>(res)
  return data.data
}
