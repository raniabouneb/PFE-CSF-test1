"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { DatesSetArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core"
import {
  CheckCircle2,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  X,
  Users,
  MapPin,
  Clock,
  Calendar,
  Loader2,
  CalendarDays,
  Link2,
  Unlink,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ADMIN_DASHBOARD_CARD_CLASS,
  ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS,
  ADMIN_DASHBOARD_CARD_TITLE_CLASS,
} from "@/lib/admin/dashboard-card-styles"
import {
  type BrainReminderState,
  type DailyNotificationDigest,
  type ReminderRule,
  type MultiSession,
  type MultiSessionGroup,
  type MultiSessionAttendee,
  type ScheduledSession,
  fetchPlanningOverview,
  patchPlanningSession,
  deletePlanningSession,
  savePlanningReminderRules,
  fetchMultiSessions,
  createMultiSession,
  patchMultiSession,
  deleteMultiSession,
  fetchMultiSessionAttendees,
  saveMultiSessionAttendance,
  fetchActiveGroups,
  fetchAvailableModules,
  addGroupToMultiSession,
  removeGroupFromMultiSession,
  fetchGCalStatus,
  fetchGCalAuthUrl,
  disconnectGCal,
  type GCalStatus,
} from "@/lib/admin/planning-api"
import {
  REMINDER_PRESET_HOURS,
  digestIndicator,
  formatISODate,
  parseISODateLocal,
} from "@/lib/admin/planning-mock"
import { cn } from "@/lib/utils"

function addMinToTime(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function oldSessionToEvent(s: ScheduledSession): EventInput {
  return {
    id: `old-${s.id}`,
    title: s.title,
    start: `${s.dateISO}T${s.startTime}`,
    end: `${s.dateISO}T${s.endTime}`,
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
    extendedProps: { oldSession: s },
  }
}

function multiSessionColor(groups: MultiSessionGroup[]): string {
  if (groups.length === 0) return "#3b82f6"
  const hasP = groups.some((g) => g.format === "ponctuelle")
  const hasR = groups.some((g) => g.format === "reconversion")
  if (hasP && hasR) return "#f97316"
  if (hasR) return "#8b5cf6"
  return "#3b82f6"
}

function multiSessionToEvent(s: MultiSession): EventInput {
  const start = s.start_time ? `${s.date}T${s.start_time}` : s.date
  const end = s.start_time && s.duration_minutes
    ? `${s.date}T${addMinToTime(s.start_time, s.duration_minutes)}`
    : undefined
  const color = multiSessionColor(s.groups)
  return {
    id: `multi-${s.id}`,
    title: s.module_label ?? s.title,
    start,
    end,
    backgroundColor: color,
    borderColor: color,
    extendedProps: { multiSession: s },
  }
}

export function AdminPlanningBoard() {
  const searchParams = useSearchParams()
  const todayISO = useMemo(() => formatISODate(new Date()), [])

  const [gcalStatus, setGcalStatus] = useState<GCalStatus>({ connected: false, configured: false })
  const [gcalLoading, setGcalLoading] = useState(true)
  const [gcalConnecting, setGcalConnecting] = useState(false)
  const [calendarView, setCalendarView] = useState<"google" | "csf">("csf")

  const [dateRange, setDateRange] = useState<{ date_from: string; date_to: string }>(() => {
    const now = new Date()
    return {
      date_from: formatISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
      date_to: formatISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }
  })

  const [oldSessions, setOldSessions] = useState<ScheduledSession[]>([])
  const [multiSessions, setMultiSessions] = useState<MultiSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [brain, setBrain] = useState<BrainReminderState>({ rules: [] })
  const [digest, setDigest] = useState<DailyNotificationDigest>({
    dateISO: todayISO,
    expectedRuns: 0,
    completedRuns: 0,
    failedRuns: 0,
  })

  const [selectedOld, setSelectedOld] = useState<ScheduledSession | null>(null)
  const [selectedMulti, setSelectedMulti] = useState<MultiSession | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [attendanceSession, setAttendanceSession] = useState<MultiSession | null>(null)

  const events = useMemo(() => {
    const multiKeys = new Set(
      multiSessions.map((m) => `${m.title}::${m.date}`)
    )
    const dedupedOld = oldSessions.filter(
      (s) => !multiKeys.has(`${s.title}::${s.dateISO}`)
    )
    return [
      ...dedupedOld.map(oldSessionToEvent),
      ...multiSessions.map(multiSessionToEvent),
    ]
  }, [oldSessions, multiSessions])

  const loadAll = useCallback(async (from: string, to: string) => {
    setIsLoading(true)
    try {
      const [overview, multi] = await Promise.all([
        fetchPlanningOverview({ startDate: from, endDate: to, date: todayISO }),
        fetchMultiSessions({ date_from: from, date_to: to }).catch(() => [] as MultiSession[]),
      ])
      setOldSessions(overview.sessions)
      setMultiSessions(multi)
      setBrain({ rules: overview.rules })
      setDigest(overview.digest)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement du planning impossible.")
    } finally {
      setIsLoading(false)
    }
  }, [todayISO])

  useEffect(() => {
    void loadAll(dateRange.date_from, dateRange.date_to)
  }, [dateRange.date_from, dateRange.date_to, loadAll])

  const refreshGCalStatus = useCallback(async () => {
    setGcalLoading(true)
    try {
      const status = await fetchGCalStatus()
      setGcalStatus(status)
      if (status.connected && status.embedUrl) {
        setCalendarView("google")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de lire le statut Google Calendar")
      setGcalStatus({ connected: false, configured: true })
    } finally {
      setGcalLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshGCalStatus()
  }, [refreshGCalStatus])

  useEffect(() => {
    const gcal = searchParams.get("gcal")
    if (!gcal) return
    if (gcal === "connected") {
      toast.success("Google Calendar connecté", {
        description: "Les séances seront synchronisées avec invitations automatiques.",
      })
      void refreshGCalStatus()
    } else if (gcal === "error") {
      toast.error("Connexion Google Calendar échouée")
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("gcal")
      url.searchParams.delete("reason")
      window.history.replaceState({}, "", url.pathname + url.search)
    }
  }, [searchParams, refreshGCalStatus])

  const reload = useCallback(() => {
    void loadAll(dateRange.date_from, dateRange.date_to)
  }, [dateRange.date_from, dateRange.date_to, loadAll])

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    const from = formatISODate(arg.start)
    const to = formatISODate(arg.end)
    setDateRange({ date_from: from, date_to: to })
  }, [])

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const old = arg.event.extendedProps.oldSession as ScheduledSession | undefined
    const multi = arg.event.extendedProps.multiSession as MultiSession | undefined
    if (multi) setSelectedMulti(multi)
    else if (old) setSelectedOld(old)
  }, [])

  const handleEventDrop = useCallback(
    async (arg: EventDropArg) => {
      const newDate = arg.event.start
      if (!newDate) { arg.revert(); return }

      const multi = arg.event.extendedProps.multiSession as MultiSession | undefined
      const old = arg.event.extendedProps.oldSession as ScheduledSession | undefined

      if (multi) {
        const dateStr = formatISODate(newDate)
        const timeStr = (newDate.getHours() || newDate.getMinutes())
          ? `${String(newDate.getHours()).padStart(2, "0")}:${String(newDate.getMinutes()).padStart(2, "0")}`
          : multi.start_time ?? undefined
        try {
          await patchMultiSession(multi.id, { date: dateStr, start_time: timeStr })
          toast.success("Séance replanifiée")
          reload()
        } catch {
          arg.revert()
          toast.error("Replanification impossible.")
        }
      } else if (old) {
        try {
          await patchPlanningSession(old.id, { scheduledAt: newDate.toISOString() })
          toast.success("Séance replanifiée")
          reload()
        } catch {
          arg.revert()
          toast.error("Replanification impossible.")
        }
      }
    },
    [reload],
  )

  const indicator = digestIndicator(digest)

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.35fr)_minmax(280px,1fr)] lg:items-start lg:gap-6">
        {/* Calendar */}
        <section className={cn(ADMIN_DASHBOARD_CARD_CLASS, "min-w-0")}>
          <div className="mb-6 flex flex-col gap-4 border-b border-neutral-200/60 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Calendrier des séances</h2>
              <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
                {calendarView === "google" && gcalStatus.connected
                  ? "Interface Google Calendar — les séances créées dans CSF s'affichent ici."
                  : "Vue CSF : groupes, présences, modules. Glissez-déposez pour replanifier."}
              </p>
              {gcalStatus.connected && gcalStatus.embedUrl ? (
                <div className="mt-3 inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setCalendarView("google")}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                      calendarView === "google"
                        ? "bg-white text-[#0D3570] shadow-sm"
                        : "text-neutral-600 hover:text-[#0D3570]",
                    )}
                  >
                    Google Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarView("csf")}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                      calendarView === "csf"
                        ? "bg-white text-[#0D3570] shadow-sm"
                        : "text-neutral-600 hover:text-[#0D3570]",
                    )}
                  >
                    Planning CSF
                  </button>
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {gcalStatus.connected && gcalStatus.openUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 text-sm"
                  onClick={() => window.open(gcalStatus.openUrl!, "_blank", "noopener,noreferrer")}
                >
                  <CalendarDays className="mr-1.5 h-4 w-4" />
                  Ouvrir Google
                </Button>
              ) : null}
              <Button
                type="button"
                className="h-9 bg-[#0D3570] text-sm font-semibold shadow-sm hover:bg-[#0a2d5c]"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Planifier une séance
              </Button>
            </div>
          </div>

          {isLoading && calendarView === "csf" ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
          ) : calendarView === "google" && gcalStatus.embedUrl ? (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <iframe
                title="Google Calendar"
                src={gcalStatus.embedUrl}
                className="h-[min(720px,75vh)] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <p className="border-t border-neutral-100 bg-slate-50 px-4 py-2 text-xs text-neutral-500">
                Calendrier vide ? Google Calendar → Paramètres du calendrier → Intégrer le calendrier,
                ou créez une séance avec « Planifier une séance ».
              </p>
            </div>
          ) : (
            <div className="fc-admin-planning">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="fr"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek",
                }}
                buttonText={{
                  today: "Aujourd'hui",
                  month: "Mois",
                  week: "Semaine",
                }}
                firstDay={1}
                height="auto"
                events={events}
                editable
                droppable={false}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                datesSet={handleDatesSet}
                eventDisplay="block"
                dayMaxEvents={4}
                nowIndicator
              />
            </div>
          )}

          {calendarView === "csf" ? (
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-neutral-200/60 pt-4">
            <span className="text-xs font-semibold text-neutral-500">Couleurs :</span>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-xs text-neutral-600">Ponctuelle</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-purple-500" />
              <span className="text-xs text-neutral-600">Reconversion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-xs text-neutral-600">Mixte</span>
            </div>
          </div>
          ) : null}
        </section>

        {/* Sidebar */}
        <div className="flex min-w-0 flex-col gap-6">
          <GoogleCalendarCard
            status={gcalStatus}
            loading={gcalLoading}
            connecting={gcalConnecting}
            onConnect={async () => {
              setGcalConnecting(true)
              try {
                const url = await fetchGCalAuthUrl()
                window.location.href = url
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Connexion impossible")
                setGcalConnecting(false)
              }
            }}
            onDisconnect={async () => {
              try {
                await disconnectGCal()
                toast.success("Google Calendar déconnecté")
                await refreshGCalStatus()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Déconnexion impossible")
              }
            }}
          />
          <StatutEnvoisCard digest={digest} variant={indicator} />
          <LeCerveauCard
            brain={brain}
            onChange={setBrain}
            onSave={async (rules) => {
              try {
                const saved = await savePlanningReminderRules(rules)
                setBrain({ rules: saved })
                toast.success("Modifications enregistrées", {
                  description: `${saved.filter((r) => r.enabled).length} règle(s) active(s).`,
                })
                void reload()
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Enregistrement des rappels impossible.")
              }
            }}
          />
        </div>
      </div>

      {/* Old session detail drawer */}
      {selectedOld && (
        <OldSessionDetailDrawer
          session={selectedOld}
          onClose={() => setSelectedOld(null)}
          onChanged={() => { setSelectedOld(null); reload() }}
        />
      )}

      {/* Multi-group session detail drawer */}
      {selectedMulti && (
        <MultiSessionDetailDrawer
          session={selectedMulti}
          onClose={() => setSelectedMulti(null)}
          onOpenAttendance={() => {
            setAttendanceSession(selectedMulti)
            setSelectedMulti(null)
          }}
          onChanged={() => { setSelectedMulti(null); reload() }}
        />
      )}

      {/* Create session form */}
      {showCreateForm && (
        <CreateSessionDrawer
          onClose={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false)
            reload()
          }}
        />
      )}

      {/* Attendance modal */}
      {attendanceSession && (
        <MultiAttendanceModal
          session={attendanceSession}
          onClose={() => {
            setAttendanceSession(null)
            reload()
          }}
        />
      )}
    </>
  )
}

/* ── Old Session Detail Drawer ─────────────────────────────────────── */

function OldSessionDetailDrawer({
  session,
  onClose,
  onChanged,
}: {
  session: ScheduledSession
  onClose: () => void
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(session.title)
  const [date, setDate] = useState(session.dateISO)
  const [startTime, setStartTime] = useState(session.startTime)
  const [duration, setDuration] = useState(String(session.durationMinutes || 120))
  const [status, setStatus] = useState(session.status)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const statutLabels: Record<string, { text: string; cls: string }> = {
    planned: { text: "Planifiée", cls: "bg-amber-100 text-amber-700" },
    completed: { text: "Terminée", cls: "bg-green-100 text-green-700" },
    cancelled: { text: "Annulée", cls: "bg-red-100 text-red-700" },
  }

  const st = statutLabels[session.status]
  const dateLabel = parseISODateLocal(session.dateISO).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await patchPlanningSession(session.id, {
        title,
        date,
        startTime: startTime,
        durationMinutes: Number(duration) || 120,
        status,
      })
      toast.success("Séance modifiée")
      onChanged()
    } catch {
      toast.error("Modification impossible")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cette séance ?")) return
    setDeleting(true)
    try {
      await deletePlanningSession(session.id)
      toast.success("Séance supprimée")
      onChanged()
    } catch {
      toast.error("Suppression impossible")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden />
      <div
        className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h3 className="text-lg font-bold text-[#0f172a]">Détail de la séance</h3>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setEditing(!editing)} className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 p-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Titre</label>
                <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Date</label>
                  <input type="date" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Heure</label>
                  <input type="time" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Durée (min)</label>
                  <input type="number" min={0} className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Statut</label>
                  <select className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="planned">Planifiée</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
              </div>
              <Button className="w-full bg-[#0D3570] hover:bg-[#0a2d5c]" disabled={saving} onClick={() => void handleSave()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h4 className="text-xl font-bold text-[#1a2a3a]">{session.title}</h4>
                {st && (
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                    {st.text}
                  </span>
                )}
              </div>

              <div className="space-y-3 rounded-xl border border-neutral-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span className="capitalize text-[#1a2a3a]">{dateLabel}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span className="text-[#1a2a3a]">
                    {session.startTime} – {session.endTime}
                    {session.durationMinutes ? ` (${session.durationMinutes} min)` : ""}
                  </span>
                </div>
                {session.targetLabel && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    <span className="text-[#1a2a3a]">{session.targetLabel}</span>
                  </div>
                )}
              </div>

              <div>
                <h5 className="mb-2 text-sm font-semibold text-neutral-500">Groupes attachés</h5>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {session.groupLabel}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-neutral-200 px-6 py-4">
          <Button
            type="button"
            variant="destructive"
            className="h-10 text-sm font-semibold"
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
            Supprimer
          </Button>
          <Button type="button" variant="outline" className="h-10 flex-1 text-sm font-semibold" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Multi-Session Detail Drawer ──────────────────────────────────────── */

function MultiSessionDetailDrawer({
  session,
  onClose,
  onOpenAttendance,
  onChanged,
}: {
  session: MultiSession
  onClose: () => void
  onOpenAttendance: () => void
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(session.title)
  const [date, setDate] = useState(session.date)
  const [startTime, setStartTime] = useState(session.start_time ?? "")
  const [duration, setDuration] = useState(String(session.duration_minutes || 60))
  const [location, setLocation] = useState(session.location ?? "")
  const [status, setStatus] = useState(session.status)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [allGroups, setAllGroups] = useState<MultiSessionGroup[]>([])
  const [sessionGroups, setSessionGroups] = useState<MultiSessionGroup[]>(session.groups)
  const [addingGroup, setAddingGroup] = useState(false)

  useEffect(() => {
    if (editing) {
      fetchActiveGroups().then(setAllGroups).catch(() => {})
    }
  }, [editing])

  const availableGroups = allGroups.filter(
    (g) => !sessionGroups.some((sg) => sg.id === g.id)
  )

  const handleAddGroup = async (groupId: number) => {
    setAddingGroup(true)
    try {
      const updated = await addGroupToMultiSession(session.id, groupId)
      setSessionGroups(updated.groups)
      toast.success("Groupe ajouté")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ajout du groupe impossible")
    } finally {
      setAddingGroup(false)
    }
  }

  const handleRemoveGroup = async (groupId: number) => {
    if (sessionGroups.length <= 1) {
      toast.error("La séance doit avoir au moins un groupe")
      return
    }
    try {
      const updated = await removeGroupFromMultiSession(session.id, groupId)
      setSessionGroups(updated.groups)
      toast.success("Groupe retiré")
    } catch {
      toast.error("Retrait du groupe impossible")
    }
  }

  const statusMap: Record<string, { text: string; cls: string }> = {
    planned: { text: "Planifiée", cls: "bg-amber-100 text-amber-700" },
    completed: { text: "Terminée", cls: "bg-green-100 text-green-700" },
    cancelled: { text: "Annulée", cls: "bg-red-100 text-red-700" },
  }
  const st = statusMap[session.status]
  const formatDateLabel = (d: string) => {
    const dt = new Date(d + "T00:00:00")
    return dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await patchMultiSession(session.id, {
        title,
        date,
        start_time: startTime || null,
        duration_minutes: Number(duration) || 60,
        location: location || null,
        status,
      })
      toast.success("Séance modifiée")
      onChanged()
    } catch {
      toast.error("Modification impossible")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cette séance ?")) return
    setDeleting(true)
    try {
      await deleteMultiSession(session.id)
      toast.success("Séance supprimée")
      onChanged()
    } catch {
      toast.error("Suppression impossible (statut non planifié ?)")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden />
      <div
        className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h3 className="text-lg font-bold text-[#0f172a]">Détail de la séance</h3>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setEditing(!editing)} className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 p-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Titre</label>
                <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Date</label>
                  <input type="date" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Heure</label>
                  <input type="time" className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Durée (min)</label>
                  <input type="number" min={0} className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-500">Lieu</label>
                  <input className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Statut</label>
                <select className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="planned">Planifiée</option>
                  <option value="completed">Terminée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-neutral-500">Groupes attachés</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {sessionGroups.map((g) => (
                    <span
                      key={g.id}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                        g.format === "reconversion" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700",
                      )}
                    >
                      {g.name}
                      <button
                        type="button"
                        className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                        onClick={() => void handleRemoveGroup(g.id)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {availableGroups.length > 0 && (
                  <select
                    className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                    value=""
                    disabled={addingGroup}
                    onChange={(e) => { if (e.target.value) void handleAddGroup(Number(e.target.value)) }}
                  >
                    <option value="">+ Ajouter un groupe…</option>
                    {availableGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.format})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <Button className="w-full bg-[#0D3570] hover:bg-[#0a2d5c]" disabled={saving} onClick={() => void handleSave()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h4 className="text-xl font-bold text-[#1a2a3a]">{session.module_label ?? session.title}</h4>
                {st && (
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                    {st.text}
                  </span>
                )}
              </div>

              <div className="space-y-3 rounded-xl border border-neutral-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span className="capitalize text-[#1a2a3a]">{formatDateLabel(session.date)}</span>
                </div>
                {session.start_time && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    <span className="text-[#1a2a3a]">
                      {session.start_time}
                      {session.duration_minutes ? ` – ${addMinToTime(session.start_time, session.duration_minutes)} (${session.duration_minutes} min)` : ""}
                    </span>
                  </div>
                )}
                {session.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    <span className="text-[#1a2a3a]">{session.location}</span>
                  </div>
                )}
              </div>

              <div>
                <h5 className="mb-2 text-sm font-semibold text-neutral-500">Groupes attachés</h5>
                <div className="flex flex-wrap gap-2">
                  {sessionGroups.map((g) => (
                    <span
                      key={g.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                        g.format === "reconversion" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700",
                      )}
                    >
                      {g.name}
                      <span className="opacity-60">({g.member_count})</span>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-neutral-200 px-6 py-4">
          <Button
            type="button"
            className="h-10 flex-1 bg-[#0D3570] text-sm font-semibold shadow-sm hover:bg-[#0a2d5c]"
            onClick={onOpenAttendance}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Gérer les présences
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-10 text-sm font-semibold"
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
            Supprimer
          </Button>
          <Button type="button" variant="outline" className="h-10 text-sm font-semibold" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Create Session Drawer ───────────────────────────────────────────── */

function CreateSessionDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [groups, setGroups] = useState<MultiSessionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState("")
  const [moduleType, setModuleType] = useState<"" | "ponctuelle" | "reconversion">("")
  const [selectedModuleRef, setSelectedModuleRef] = useState("")
  const [selectedModuleLabel, setSelectedModuleLabel] = useState("")
  const [availableModules, setAvailableModules] = useState<import("@/lib/admin/planning-api").AvailableModules>({ ponctuelle: [], reconversion: [] })
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [duration, setDuration] = useState(60)
  const [location, setLocation] = useState("")
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])

  useEffect(() => {
    Promise.all([
      fetchActiveGroups(),
      fetchAvailableModules(),
    ])
      .then(([g, m]) => {
        setGroups(g)
        setAvailableModules(m)
      })
      .catch(() => toast.error("Impossible de charger les données"))
      .finally(() => setLoading(false))
  }, [])

  const moduleList = moduleType === "ponctuelle"
    ? availableModules.ponctuelle
    : moduleType === "reconversion"
      ? availableModules.reconversion
      : []

  const totalLearners = useMemo(
    () => groups.filter((g) => selectedGroupIds.includes(g.id)).reduce((s, g) => s + g.member_count, 0),
    [groups, selectedGroupIds],
  )

  const toggleGroup = (id: number) => {
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleModuleSelect = (ref: string) => {
    setSelectedModuleRef(ref)
    const mod = moduleList.find((m) => m.ref === ref)
    if (mod) {
      setSelectedModuleLabel(mod.title)
      if (!title.trim()) setTitle(mod.title)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !date || selectedGroupIds.length === 0) {
      toast.error("Titre, date et au moins un groupe sont requis.")
      return
    }
    setSaving(true)
    try {
      await createMultiSession({
        title: title.trim(),
        module_target_ref: selectedModuleRef || null,
        module_label: selectedModuleLabel || title.trim(),
        date,
        start_time: startTime || null,
        duration_minutes: duration,
        location: location.trim() || null,
        group_ids: selectedGroupIds,
      })
      toast.success("Séance planifiée avec succès")
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden />
      <div
        className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h3 className="text-lg font-bold text-[#0f172a]">Planifier une séance</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 p-6">
          {/* Module type selector */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Type de formation *</label>
            <div className="flex gap-2">
              {(["ponctuelle", "reconversion"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setModuleType(t)
                    setSelectedModuleRef("")
                    setSelectedModuleLabel("")
                  }}
                  className={cn(
                    "flex-1 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition",
                    moduleType === t
                      ? t === "reconversion"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-neutral-200 text-neutral-500 hover:border-neutral-300",
                  )}
                >
                  {t === "ponctuelle" ? "Ponctuelle" : "Reconversion"}
                </button>
              ))}
            </div>
          </div>

          {/* Module selector */}
          {moduleType && (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Module ciblé *</label>
              {moduleList.length === 0 ? (
                <p className="text-sm text-neutral-400">Aucun module disponible.</p>
              ) : (
                <select
                  value={selectedModuleRef}
                  onChange={(e) => handleModuleSelect(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0D3570] focus:outline-none focus:ring-1 focus:ring-[#0D3570]"
                >
                  <option value="">— Sélectionner un module —</option>
                  {moduleList.map((m) => (
                    <option key={m.ref} value={m.ref}>
                      {m.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Titre de la séance *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0D3570] focus:outline-none focus:ring-1 focus:ring-[#0D3570]"
              placeholder="Ex: Séance Sécurité Réseaux"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0D3570] focus:outline-none focus:ring-1 focus:ring-[#0D3570]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Heure de début</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0D3570] focus:outline-none focus:ring-1 focus:ring-[#0D3570]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Durée (min)</label>
              <input
                type="number"
                min={0}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0D3570] focus:outline-none focus:ring-1 focus:ring-[#0D3570]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Lieu</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0D3570] focus:outline-none focus:ring-1 focus:ring-[#0D3570]"
                placeholder="Ex: Salle 3"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Groupes participants *
              {selectedGroupIds.length > 0 && (
                <span className="ml-2 text-xs font-normal text-neutral-400">
                  {selectedGroupIds.length} sélectionné(s) · {totalLearners} apprenant(s)
                </span>
              )}
            </label>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-neutral-400">Aucun groupe actif trouvé.</p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-neutral-200 p-2">
                {groups.map((g) => {
                  const selected = selectedGroupIds.includes(g.id)
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGroup(g.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                        selected ? "bg-[#0D3570]/10 ring-1 ring-[#0D3570]/30" : "hover:bg-neutral-50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-4 w-4 rounded border-2 transition",
                            selected ? "border-[#0D3570] bg-[#0D3570]" : "border-neutral-300",
                          )}
                        >
                          {selected && (
                            <CheckCircle2 className="h-3 w-3 text-white" style={{ margin: "0.5px" }} />
                          )}
                        </div>
                        <span className="font-medium text-[#1a2a3a]">{g.name}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            g.format === "reconversion" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700",
                          )}
                        >
                          {g.format}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400">{g.member_count} membres</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 border-t border-neutral-200 px-6 py-4">
          <Button
            type="button"
            disabled={saving}
            className="h-10 flex-1 bg-[#0D3570] text-sm font-semibold shadow-sm hover:bg-[#0a2d5c] disabled:opacity-50"
            onClick={handleSubmit}
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
            Planifier
          </Button>
          <Button type="button" variant="outline" className="h-10 text-sm font-semibold" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Multi Attendance Modal ──────────────────────────────────────────── */

function MultiAttendanceModal({
  session,
  onClose,
}: {
  session: MultiSession
  onClose: () => void
}) {
  const [attendees, setAttendees] = useState<MultiSessionAttendee[]>([])
  const [localPresence, setLocalPresence] = useState<Map<number, boolean>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMultiSessionAttendees(session.id)
      .then((data) => {
        setAttendees(data)
        const map = new Map<number, boolean>()
        data.forEach((a) => map.set(a.member_id, a.present ?? false))
        setLocalPresence(map)
      })
      .catch(() => toast.error("Impossible de charger les participants"))
      .finally(() => setLoading(false))
  }, [session.id])

  const toggleAll = (val: boolean) => {
    const map = new Map<number, boolean>()
    attendees.forEach((a) => map.set(a.member_id, val))
    setLocalPresence(new Map(map))
  }

  const toggle = (memberId: number) => {
    setLocalPresence((prev) => {
      const next = new Map(prev)
      next.set(memberId, !next.get(memberId))
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const records = attendees.map((a) => ({
        member_id: a.member_id,
        present: localPresence.get(a.member_id) ?? false,
      }))
      await saveMultiSessionAttendance(session.id, records)
      toast.success("Présences enregistrées — progression recalculée")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const presentCount = [...localPresence.values()].filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" aria-hidden />
      <div
        className="relative z-10 flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-[#0f172a]">Présences — {session.module_label ?? session.title}</h3>
            <p className="mt-0.5 text-xs text-neutral-400">
              {attendees.length} apprenants · {presentCount} présent(s)
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-neutral-100 px-6 py-2">
          <Button type="button" variant="outline" className="h-7 text-xs" onClick={() => toggleAll(true)}>
            Tous présents
          </Button>
          <Button type="button" variant="outline" className="h-7 text-xs" onClick={() => toggleAll(false)}>
            Tous absents
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : attendees.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">Aucun apprenant dans les groupes liés.</p>
          ) : (
            <div className="space-y-1">
              {attendees.map((a) => {
                const present = localPresence.get(a.member_id) ?? false
                return (
                  <button
                    key={a.member_id}
                    type="button"
                    onClick={() => toggle(a.member_id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition",
                      present ? "bg-green-50" : "hover:bg-neutral-50",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                          present ? "border-green-500 bg-green-500 text-white" : "border-neutral-300",
                        )}
                      >
                        {present && "✓"}
                      </div>
                      <div>
                        <span className="font-medium text-[#1a2a3a]">
                          {a.first_name ?? ""} {a.last_name ?? ""}
                        </span>
                        <span className="ml-1.5 text-xs text-neutral-400">{a.email}</span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                        a.group_format === "reconversion" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700",
                      )}
                    >
                      {a.group_format}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-neutral-200 px-6 py-4">
          <Button
            type="button"
            disabled={saving}
            className="h-10 flex-1 bg-[#0D3570] text-sm font-semibold shadow-sm hover:bg-[#0a2d5c] disabled:opacity-50"
            onClick={handleSave}
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Enregistrer les présences
          </Button>
          <Button type="button" variant="outline" className="h-10 text-sm font-semibold" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── Sidebar: Google Calendar ─────────────────────────────────────────── */

export function GoogleCalendarCard({
  status,
  loading,
  connecting,
  onConnect,
  onDisconnect,
}: {
  status: GCalStatus
  loading: boolean
  connecting: boolean
  onConnect: () => void | Promise<void>
  onDisconnect: () => void | Promise<void>
}) {
  return (
    <section className={ADMIN_DASHBOARD_CARD_CLASS}>
      <header className="border-b border-neutral-200/60 pb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#0D3570]" aria-hidden />
          <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Google Calendar</h3>
        </div>
        <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
          Agenda Google intégré : création d&apos;événements, invitations, rappels, vues.
        </p>
      </header>

      <div className="mt-5">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : !status.configured ? (
          <p className="text-sm text-amber-700">
            Clés Google manquantes côté serveur (GOOGLE_CLIENT_ID / SECRET).
          </p>
        ) : status.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span className="text-sm font-medium text-emerald-800">Connecté</span>
            </div>
            <p className="text-xs text-neutral-500">
              Utilisez l&apos;agenda à gauche : clic sur un créneau pour créer un événement, inviter des
              participants, configurer des rappels, changer de vue (mois, semaine, jour).
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full text-sm"
              onClick={() => void onDisconnect()}
            >
              <Unlink className="mr-1.5 h-4 w-4" />
              Déconnecter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">
              Connectez le compte Google du centre de formation pour activer les notifications automatiques.
            </p>
            <Button
              type="button"
              className="h-9 w-full bg-[#0D3570] text-sm font-semibold hover:bg-[#0a2d5c]"
              disabled={connecting}
              onClick={() => void onConnect()}
            >
              {connecting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-1.5 h-4 w-4" />
              )}
              Connecter Google Calendar
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

/* ── Sidebar: Statut des envois ───────────────────────────────────────── */

export function StatutEnvoisCard({
  digest,
  variant,
}: {
  digest: DailyNotificationDigest
  variant: ReturnType<typeof digestIndicator>
}) {
  const jourLabel = useMemo(
    () =>
      parseISODateLocal(digest.dateISO).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [digest.dateISO],
  )

  const pct =
    digest.expectedRuns === 0
      ? 100
      : Math.min(100, Math.round((digest.completedRuns / digest.expectedRuns) * 100))

  const ok = variant === "success"
  const footerOk = ok && digest.failedRuns === 0

  return (
    <section className={ADMIN_DASHBOARD_CARD_CLASS}>
      <header className="flex items-start justify-between gap-3 border-b border-neutral-200/60 pb-4">
        <div className="min-w-0">
          <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Statut des envois</h3>
          <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>Journée du {jourLabel}</p>
        </div>
        {ok ? (
          <CheckCircle2 className="size-9 shrink-0 text-emerald-500" aria-hidden />
        ) : (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-lg font-bold",
              variant === "danger" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700",
            )}
          >
            {pct}%
          </span>
        )}
      </header>

      <div className="mt-5 flex items-end gap-2">
        {ok ? (
          <span className="font-mono text-4xl font-bold tracking-tight text-emerald-600">{pct}%</span>
        ) : (
          <span className="font-mono text-4xl font-bold tracking-tight text-[#0f172a]">{pct}%</span>
        )}
      </div>
      <p className="mt-1 text-sm font-medium text-neutral-700">
        {digest.completedRuns} / {digest.expectedRuns} envoyés
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-neutral-200/60 bg-white px-3 py-2.5 shadow-sm">
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            footerOk ? "bg-emerald-500" : variant === "danger" ? "bg-red-500" : "bg-amber-500",
          )}
          aria-hidden
        />
        <p className="text-xs font-medium leading-snug text-neutral-600">
          {footerOk
            ? "Système automatisé actif et fonctionnel"
            : variant === "danger"
              ? "Des envois ont échoué — vérifiez les journaux."
              : "Certains envois sont encore en cours ou en erreur."}
        </p>
      </div>
    </section>
  )
}

/* ── Sidebar: Le Cerveau ──────────────────────────────────────────────── */

export function LeCerveauCard({
  brain,
  onChange,
  onSave,
}: {
  brain: BrainReminderState
  onChange: (b: BrainReminderState) => void
  onSave: (rules: ReminderRule[]) => Promise<void>
}) {
  const updateRule = (id: string, patch: Partial<ReminderRule>) => {
    onChange({
      rules: brain.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })
  }

  const addRule = () => {
    const next: ReminderRule = {
      id: `rule-${Date.now()}`,
      label: "Nouvelle règle",
      enabled: true,
      hoursBefore: 12,
      channels: { email: true, sms: false },
    }
    onChange({ rules: [...brain.rules, next] })
  }

  const removeRule = (id: string) => {
    if (brain.rules.length <= 1) {
      toast.error("Au moins une règle de rappel est nécessaire.")
      return
    }
    onChange({ rules: brain.rules.filter((r) => r.id !== id) })
    toast.success("Règle supprimée")
  }

  return (
    <section className={ADMIN_DASHBOARD_CARD_CLASS}>
      <header className="border-b border-neutral-200/60 pb-4">
        <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Le Cerveau</h3>
        <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
          Définissez quand les apprenants recevront des notifications pour leurs séances.
        </p>
      </header>

      <ul className="mt-5 space-y-3">
        {brain.rules.map((rule) => (
          <li
            key={rule.id}
            className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <ReminderToggle
                  pressed={rule.enabled}
                  onPressedChange={(enabled) => updateRule(rule.id, { enabled })}
                />
                <span className="min-w-0 flex-1 text-sm font-medium text-[#0f172a]">{rule.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="min-w-[9.5rem] rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-[#334155] shadow-sm outline-none focus:border-[#0D3570] focus:ring-2 focus:ring-[#0D3570]/20"
                  value={rule.hoursBefore}
                  disabled={!rule.enabled}
                  onChange={(e) =>
                    updateRule(rule.id, { hoursBefore: Number(e.target.value) })
                  }
                >
                  {REMINDER_PRESET_HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h === 1 ? "1 heure avant" : `${h} heures avant`}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <ChannelToggle
                    active={rule.channels.email}
                    disabled={!rule.enabled}
                    icon={<Mail className="size-4" />}
                    label="E-mail"
                    onClick={() =>
                      updateRule(rule.id, {
                        channels: { ...rule.channels, email: !rule.channels.email },
                      })
                    }
                  />
                  <ChannelToggle
                    active={rule.channels.sms}
                    disabled={!rule.enabled}
                    icon={<MessageCircle className="size-4" />}
                    label="SMS / Message"
                    onClick={() =>
                      updateRule(rule.id, {
                        channels: { ...rule.channels, sms: !rule.channels.sms },
                      })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ms-auto shrink-0 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Supprimer la règle « ${rule.label} »`}
                  onClick={() => removeRule(rule.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addRule}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white py-2.5 text-xs font-semibold text-[#0D3570] transition-colors hover:border-[#0D3570]/35 hover:bg-[#0D3570]/[0.04]"
      >
        <Plus className="size-4" aria-hidden />
        Ajouter une règle de rappel
      </button>

      <Button
        type="button"
        className="mt-5 h-10 w-full bg-[#0D3570] text-sm font-semibold shadow-sm hover:bg-[#0a2d5c]"
        onClick={() => void onSave(brain.rules)}
      >
        Enregistrer les modifications
      </Button>
    </section>
  )
}

/* ── Small toggle components ──────────────────────────────────────────── */

function ReminderToggle({
  pressed,
  onPressedChange,
}: {
  pressed: boolean
  onPressedChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D3570]",
        pressed ? "bg-emerald-500" : "bg-neutral-300",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-1 left-1 size-5 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-200",
          pressed ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  )
}

function ChannelToggle({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean
  disabled?: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg border transition-colors",
        disabled && "opacity-40",
        active
          ? "border-[#0D3570]/35 bg-[#0D3570]/10 text-[#0D3570]"
          : "border-neutral-200 bg-white text-neutral-400 hover:text-neutral-600",
      )}
    >
      {icon}
    </button>
  )
}
