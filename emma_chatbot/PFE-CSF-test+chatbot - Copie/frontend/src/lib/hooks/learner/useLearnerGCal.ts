import { useQuery } from "@tanstack/react-query"
import { learnerGet } from "@/lib/api-client"
import { buildGoogleCalendarEmbedUrl } from "@/lib/google-calendar-embed"

export type LearnerGCalStatus = {
  connected: boolean
  configured: boolean
  calendarId?: string | null
  embedUrl?: string | null
  openUrl?: string | null
  profileEmail?: string | null
  emailMismatch?: boolean
}

function normalizeStatus(raw: Record<string, unknown>): LearnerGCalStatus {
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
  if (connected && !embedUrl && calendarId) {
    embedUrl = buildGoogleCalendarEmbedUrl(calendarId, "MONTH")
  }
  return {
    connected,
    configured,
    calendarId,
    embedUrl,
    openUrl:
      (typeof raw.openUrl === "string" ? raw.openUrl : null) ??
      (typeof raw.open_url === "string" ? raw.open_url : null) ??
      "https://calendar.google.com/calendar/r",
    profileEmail:
      (typeof raw.profileEmail === "string" ? raw.profileEmail : null) ??
      (typeof raw.profile_email === "string" ? raw.profile_email : null) ??
      null,
    emailMismatch: Boolean(raw.emailMismatch ?? raw.email_mismatch),
  }
}

export function useLearnerGCalStatus() {
  return useQuery({
    queryKey: ["learner-gcal-status"] as const,
    queryFn: async () => {
      const raw = await learnerGet<Record<string, unknown>>("formations/gcal/status")
      return normalizeStatus(raw)
    },
    staleTime: 30_000,
  })
}

export async function fetchLearnerGCalAuthUrl(): Promise<string> {
  const data = await learnerGet<{ url: string }>("formations/gcal/auth-url")
  return data.url
}
