/** Données mock pour Planning & Séances — à remplacer par API plus tard. */

export type ScheduledSession = {
  id: string
  title: string
  /** YYYY-MM-DD (locale serveur / jour civil) */
  dateISO: string
  /** HH:mm */
  startTime: string
  /** HH:mm — affichage « début – fin » ; défaut +2 h si absent */
  endTime?: string
  groupLabel: string
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

/** @deprecated préférer BrainReminderState — conservé pour migrations éventuelles */
export type ReminderSettings = {
  hoursBeforeSession: number
}

export type DailyNotificationDigest = {
  dateISO: string
  /** Nombre de rappels planifiés pour cette journée */
  expectedRuns: number
  /** Envoyés avec succès */
  completedRuns: number
  /** Échecs techniques */
  failedRuns: number
}

export function formatISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function parseISODateLocal(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number)
  return new Date(y, m - 1, day)
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + n)
  return x
}

/** Premier jour de la semaine (lundi), heure locale */
export function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = copy.getDay()
  const diffFromMonday = (dow + 6) % 7
  copy.setDate(copy.getDate() - diffFromMonday)
  return copy
}

/** Grille calendrier : lundi en premier, cases null = hors mois pour alignement */
export function getMonthGridCells(year: number, monthIndex: number): (Date | null)[] {
  const first = new Date(year, monthIndex, 1)
  const padStart = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < padStart; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndex, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export const WEEKDAY_LABELS_SHORT_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const

export const REMINDER_PRESET_HOURS = [1, 2, 6, 12, 24, 48, 72] as const

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  hoursBeforeSession: 24,
}

export function createDefaultBrainReminderState(): BrainReminderState {
  return {
    rules: [
      {
        id: "rule-main",
        label: "Rappel principal",
        enabled: true,
        hoursBefore: 24,
        channels: { email: true, sms: true },
      },
      {
        id: "rule-last",
        label: "Rappel de dernière minute",
        enabled: true,
        hoursBefore: 2,
        channels: { email: true, sms: false },
      },
    ],
  }
}

function defaultEndFromStart(startHHmm: string): string {
  const [h, m] = startHHmm.split(":").map(Number)
  const startMin = h * 60 + m
  const endMin = startMin + 120
  const eh = Math.floor(endMin / 60) % 24
  const em = endMin % 60
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`
}

/** Séances initiales réparties sur le mois courant + débordements */
export function createInitialSessions(): ScheduledSession[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  const day = (d: number) => formatISODate(new Date(y, m, d))

  return [
    {
      id: "s1",
      title: "Python avancé",
      dateISO: day(3),
      startTime: "14:00",
      endTime: "16:00",
      groupLabel: "Grp A",
    },
    {
      id: "s2",
      title: "AWS Cloud Arch",
      dateISO: day(5),
      startTime: "09:00",
      endTime: "12:00",
      groupLabel: "Grp B",
    },
    {
      id: "s3",
      title: "DevOps CI/CD",
      dateISO: day(10),
      startTime: "10:30",
      endTime: "12:30",
      groupLabel: "Grp A",
    },
    {
      id: "s4",
      title: "RTOS — notions",
      dateISO: day(10),
      startTime: "15:00",
      endTime: "17:00",
      groupLabel: "Grp C",
    },
    {
      id: "s5",
      title: "API REST & sécurité",
      dateISO: day(14),
      startTime: "09:30",
      endTime: "11:30",
      groupLabel: "Grp A",
    },
    {
      id: "s6",
      title: "Sprint review",
      dateISO: day(17),
      startTime: "11:00",
      endTime: "12:00",
      groupLabel: "Grp B",
    },
    {
      id: "s7",
      title: "Campagne de tests",
      dateISO: day(19),
      startTime: "13:30",
      endTime: "16:00",
      groupLabel: "Grp A",
    },
    {
      id: "s8",
      title: "Capteurs & bus",
      dateISO: day(22),
      startTime: "09:00",
      endTime: "11:00",
      groupLabel: "Grp C",
    },
    {
      id: "s9",
      title: "Clôture module",
      dateISO: day(26),
      startTime: "16:00",
      endTime: "17:30",
      groupLabel: "Grp A",
    },
  ].map((s) => ({
    ...s,
    endTime: s.endTime ?? defaultEndFromStart(s.startTime),
  }))
}

/** Digest fictif pour la date du jour (démo) */
export function createTodayDigestMock(todayISO: string): DailyNotificationDigest {
  return {
    dateISO: todayISO,
    expectedRuns: 42,
    completedRuns: 42,
    failedRuns: 0,
  }
}

export function digestIndicator(
  d: DailyNotificationDigest
): "success" | "warning" | "danger" | "neutral" {
  if (d.expectedRuns === 0) return "neutral"
  if (d.failedRuns > 0 && d.completedRuns === 0) return "danger"
  if (d.completedRuns >= d.expectedRuns && d.failedRuns === 0) return "success"
  return "warning"
}
