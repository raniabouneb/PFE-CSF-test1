/** URL Google Calendar « créer un événement » (hors iframe). */

const TZ = "Europe/Paris"

function formatGoogleDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  )
}

export function buildGoogleCalendarComposeUrl(params: {
  title: string
  details?: string
  location?: string
  start: Date
  end: Date
  attendeeEmails?: string[]
}): string {
  const qs = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${formatGoogleDate(params.start)}/${formatGoogleDate(params.end)}`,
    ctz: TZ,
  })
  if (params.details) qs.set("details", params.details)
  if (params.location) qs.set("location", params.location)
  const emails = (params.attendeeEmails ?? [])
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"))
  if (emails.length) qs.set("add", emails.join(","))
  return `https://calendar.google.com/calendar/render?${qs.toString()}`
}

/** Créneau par défaut : prochain jour ouvré 9h–11h. */
export function defaultComposeSlot(): { start: Date; end: Date } {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  start.setHours(9, 0, 0, 0)
  const end = new Date(start)
  end.setHours(11, 0, 0, 0)
  return { start, end }
}
