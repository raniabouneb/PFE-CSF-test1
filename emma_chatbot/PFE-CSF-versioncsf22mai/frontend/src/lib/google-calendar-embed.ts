/** URL iframe Google Calendar (admin + apprenant). */

const GCAL_EMBED_TZ = "Europe/Paris"

export function buildGoogleCalendarEmbedUrl(
  calendarId: string,
  mode: "MONTH" | "WEEK" | "DAY" | "AGENDA" = "MONTH",
): string {
  const src = encodeURIComponent(calendarId)
  const ctz = encodeURIComponent(GCAL_EMBED_TZ)
  return (
    "https://calendar.google.com/calendar/embed" +
    `?src=${src}&ctz=${ctz}&hl=fr&mode=${mode}` +
    "&showTitle=1&showNav=1&showDate=1&showPrint=0&showTabs=1" +
    "&showCalendars=0&showTz=1&wkst=2"
  )
}

export const GOOGLE_CALENDAR_OPEN_URL = "https://calendar.google.com/calendar/r"

export function buildCsfLinkMarker(groupId: number, moduleTargetRef: string): string {
  return `CSF-LINK:group=${groupId}|module=${moduleTargetRef}`
}
