/** URLs Google Calendar côté apprenant (pas d’OAuth — invitations par e-mail). */

export const LEARNER_GOOGLE_CALENDAR_OPEN_URL = "https://calendar.google.com/calendar/r"

const GCAL_EMBED_TZ = "Europe/Paris"

/** Calendrier public CSF optionnel (NEXT_PUBLIC_CSF_GOOGLE_CALENDAR_EMBED_SRC). */
export function resolveLearnerCalendarEmbedUrl(): string | null {
  const src = process.env.NEXT_PUBLIC_CSF_GOOGLE_CALENDAR_EMBED_SRC?.trim()
  if (!src) return null
  const encoded = encodeURIComponent(src)
  const ctz = encodeURIComponent(GCAL_EMBED_TZ)
  return (
    "https://calendar.google.com/calendar/embed" +
    `?src=${encoded}&ctz=${ctz}&hl=fr&mode=AGENDA` +
    "&showTitle=0&showNav=1&showDate=1&showTabs=1&showCalendars=0&wkst=2"
  )
}
