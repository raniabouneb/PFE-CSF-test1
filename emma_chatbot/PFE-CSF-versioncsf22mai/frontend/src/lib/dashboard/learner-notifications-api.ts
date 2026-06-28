/**
 * Client-side API for learner notifications.
 * Uses the Next.js proxy route (cookie-based auth forwarded as Bearer).
 */

export type LearnerNotificationKind =
  | "doc_validated"
  | "doc_rejected"
  | "cert_available"
  | "session_scheduled"

export type LearnerNotificationItem = {
  id: number
  kind: LearnerNotificationKind
  title: string
  body: string | null
  linkRef: string | null
  isRead: boolean
  createdAt: string | null
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Erreur ${res.status}`
    try {
      const j = (await res.json()) as { detail?: string; error?: string }
      msg = j.detail ?? j.error ?? msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  return (await res.json()) as T
}

export async function fetchLearnerNotifications(): Promise<LearnerNotificationItem[]> {
  const res = await fetch("/api/learner/notifications", { credentials: "include", cache: "no-store" })
  const data = await readJson<{ items: LearnerNotificationItem[] }>(res)
  return data.items
}

export async function markNotificationRead(id: number): Promise<void> {
  const res = await fetch(`/api/learner/notifications/${id}/read`, {
    method: "POST",
    credentials: "include",
  })
  await readJson<{ ok: boolean }>(res)
}
