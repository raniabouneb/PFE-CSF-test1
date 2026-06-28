import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { getBackendUrl } from "@/lib/server/backend"
import type { LinkedCertCard, PendingCertRow, ReadyCertificateItem } from "@/lib/dashboard/certifications-page-data"
import type { ModuleDetail } from "@/lib/dashboard/formations-module-details"

type Badge = { label: string; variant: "neutral" | "success" | "warning" }
type Stat = { label: string; value: string }
type CourseModule = {
  id: string
  title: string
  statusLabel: string
  variant: "completed" | "in_progress"
  progress?: number
  imageSrc?: string
  locked?: boolean
}

export type LearnerAttendancePresence = {
  presentHours: number
  absentHours: number
  attendancePercent: number
}

export type LearnerDashboardPayload = {
  greetingName: string
  formationsCard: {
    count: number
    completed: number
    moduleBars?: {
      title: string
      percent: number
      targetRef?: string
      groupId?: string
      memberId?: string
      presence?: LearnerAttendancePresence
    }[]
  }
  certificationsCard: { obtained: number; total: number; percentage: number; failPercentage: number }
  activeFormations: {
    id: string
    title: string
    badges: { label: string; className: string }[]
    progressLabel: string
    progress: number
  }[]
  notifications: { id: string; icon: "alert" | "clock" | "book" | "calendar"; title: string; description: string; time: string }[]
  profileCard: {
    name: string
    email: string
    points: number
    attendance: number
    attendanceSummary?: LearnerAttendancePresence
  }
  calendarEvents: { id: string; day: number; month: string; title: string; time: string; description?: string }[]
}

export type LearnerFormationsPayload = {
  greetingName: string
  courses: {
    memberId: string
    groupId: string
    accessId: string
    groupLabel: string
    title: string
    subtitle: string
    badges: Badge[]
    stats: Stat[]
    progressPercent: number
    modules: CourseModule[]
    rawModules?: { targetRef: string; title?: string; imageUrl?: string }[]
    attendanceRate?: number
    presentHours?: number
    absentHours?: number
    certifications?: { id: string; title: string; status: string; scorePercent?: number | null }[]
    minutesCompleted?: number
    minutesTotal?: number
  }[]
}

export type LearnerCertificationsPayload = {
  summary: {
    readyToPrint: number
    unlocked: number
    successRate: number
    blocked: number
    pendingValidation: number
  }
  readyCertificates: ReadyCertificateItem[]
  pendingRows: PendingCertRow[]
  linkedCards: LinkedCertCard[]
}

async function fetchLearner<T>(path: string): Promise<T | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/learner/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getLearnerDashboard(): Promise<LearnerDashboardPayload | null> {
  return fetchLearner<LearnerDashboardPayload>("dashboard")
}

export async function getLearnerFormations(): Promise<LearnerFormationsPayload | null> {
  return fetchLearner<LearnerFormationsPayload>("formations")
}

export async function getLearnerFormationDetail(moduleId: string): Promise<ModuleDetail | null> {
  return fetchLearner<ModuleDetail>(`formations/${encodeURIComponent(moduleId)}`)
}

export async function getLearnerCertifications(): Promise<LearnerCertificationsPayload | null> {
  return fetchLearner<LearnerCertificationsPayload>("certifications")
}

export async function getLearnerProfileSummary(): Promise<Record<string, unknown> | null> {
  return fetchLearner<Record<string, unknown>>("profile-summary")
}

export type AutoCvData = {
  formations: { id: string; title: string; period: string | null; status: string | null; notes: string | null }[]
  projects: { id: string; title: string; description: string; context: string | null }[]
  certifications: { id: string; title: string; date: string | null; issuer: string | null }[]
}

export async function getLearnerAutoCv(): Promise<AutoCvData | null> {
  return fetchLearner<AutoCvData>("auto-cv")
}


// ── New LMS endpoints (/api/learner/formations) ──────────────────────────

async function fetchLms<T>(path: string): Promise<T | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const res = await fetch(`${getBackendUrl()}/api/learner/formations${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export type LmsModuleProgress = {
  module_id: string
  titre: string
  duree_minutes: number | null
  minutes_validees: number
  progress_percent: number
}

export type LmsPackModuleProgress = {
  module_id: string
  titre: string
  ordre: number
  statut: "locked" | "open" | "done"
  unlocked_at: string | null
  completed_at: string | null
}

export type LmsEnrollment = {
  enrollment_id: string
  groupe_id: string
  groupe_nom: string
  type: "ponctuelle" | "reconversion"
  groupe_statut: string
  progress_percent: number
  modules: LmsModuleProgress[]
  pack_modules: LmsPackModuleProgress[]
}

export type LmsModuleDetail = {
  id: string
  titre: string
  description: string | null
  duree_minutes: number | null
  pdf_url: string | null
  minutes_validees: number
  statut: string | null
  sessions: LmsLearnerSession[]
}

export type LmsLearnerSession = {
  session_id: string
  titre: string
  date: string
  heure_debut: string | null
  duree_minutes: number | null
  lieu: string | null
  statut: string
  module_titre: string | null
  groupe_nom: string | null
}

export async function getLmsEnrollments(): Promise<LmsEnrollment[] | null> {
  return fetchLms<LmsEnrollment[]>("/")
}

export async function getLmsModuleDetail(
  enrollmentId: string,
  moduleId: string,
): Promise<LmsModuleDetail | null> {
  return fetchLms<LmsModuleDetail>(`/${encodeURIComponent(enrollmentId)}/modules/${encodeURIComponent(moduleId)}`)
}
