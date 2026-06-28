"use client"

import { useCallback, useMemo, useState, type ReactNode } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Mail,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ADMIN_DASHBOARD_CARD_CLASS,
  ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS,
  ADMIN_DASHBOARD_CARD_TITLE_CLASS,
} from "@/lib/admin/dashboard-card-styles"
import {
  REMINDER_PRESET_HOURS,
  WEEKDAY_LABELS_SHORT_FR,
  type BrainReminderState,
  type DailyNotificationDigest,
  type ReminderRule,
  type ScheduledSession,
  addDays,
  createDefaultBrainReminderState,
  createInitialSessions,
  createTodayDigestMock,
  digestIndicator,
  formatISODate,
  getMonthGridCells,
  parseISODateLocal,
  startOfWeekMonday,
} from "@/lib/admin/planning-mock"
import { cn } from "@/lib/utils"

type CalendarView = "month" | "week"

const DRAG_TYPE = "application/x-csf-session-id"

export function AdminPlanningBoard() {
  const todayISO = useMemo(() => formatISODate(new Date()), [])
  const [sessions, setSessions] = useState<ScheduledSession[]>(() => createInitialSessions())
  const [brain, setBrain] = useState<BrainReminderState>(() => createDefaultBrainReminderState())
  const [digest] = useState<DailyNotificationDigest>(() => createTodayDigestMock(todayISO))

  const [view, setView] = useState<CalendarView>("month")
  const [visibleDate, setVisibleDate] = useState(() => new Date())

  const moveSessionToDate = useCallback((sessionId: string, targetISO: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, dateISO: targetISO } : s))
    )
    toast.success("Séance replanifiée", {
      description: parseISODateLocal(targetISO).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    })
  }, [])

  const monthLabel = useMemo(
    () =>
      visibleDate.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    [visibleDate]
  )

  const weekStart = useMemo(() => startOfWeekMonday(visibleDate), [visibleDate])
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])
  const weekRangeLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
    const a = weekStart.toLocaleDateString("fr-FR", opts)
    const b = weekEnd.toLocaleDateString("fr-FR", { ...opts, year: "numeric" })
    return `${a} – ${b}`
  }, [weekStart, weekEnd])

  const goPrev = () => {
    setVisibleDate((d) => {
      if (view === "month") return new Date(d.getFullYear(), d.getMonth() - 1, 1)
      return addDays(d, -7)
    })
  }

  const goNext = () => {
    setVisibleDate((d) => {
      if (view === "month") return new Date(d.getFullYear(), d.getMonth() + 1, 1)
      return addDays(d, 7)
    })
  }

  const goToday = () => setVisibleDate(new Date())

  const indicator = digestIndicator(digest)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2.35fr)_minmax(280px,1fr)] lg:items-start lg:gap-6">
      <section className={cn(ADMIN_DASHBOARD_CARD_CLASS, "min-w-0")}>
        <div className="mb-6 flex flex-col gap-5 border-b border-neutral-200/60 pb-5">
          <div className="min-w-0">
            <h2 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Calendrier des séances</h2>
            <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
              Glissez et déposez les séances pour les reprogrammer facilement.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-neutral-200/90 bg-white p-0.5 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 text-neutral-600 hover:bg-[#f4f7fb]"
                  onClick={goPrev}
                  aria-label={view === "month" ? "Mois précédent" : "Semaine précédente"}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 text-neutral-600 hover:bg-[#f4f7fb]"
                  onClick={goNext}
                  aria-label={view === "month" ? "Mois suivant" : "Semaine suivante"}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goToday}
                className="h-8 border-neutral-200 bg-white text-xs font-medium text-[#334155] shadow-sm hover:bg-neutral-50"
              >
                Aujourd’hui
              </Button>
            </div>
            <p className="text-center text-sm font-semibold capitalize text-[#0f172a] sm:min-w-[12rem] sm:flex-1">
              {view === "month" ? monthLabel : weekRangeLabel}
            </p>
            <div className="flex justify-center sm:justify-end">
              <div className="inline-flex rounded-lg border border-neutral-200/90 bg-white p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setView("month")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    view === "month"
                      ? "bg-[#0D3570] text-white shadow-sm"
                      : "text-neutral-600 hover:bg-[#f4f7fb]"
                  )}
                >
                  Mois
                </button>
                <button
                  type="button"
                  onClick={() => setView("week")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    view === "week"
                      ? "bg-[#0D3570] text-white shadow-sm"
                      : "text-neutral-600 hover:bg-[#f4f7fb]"
                  )}
                >
                  Semaine
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="-mx-1 sm:mx-0">
          {view === "month" ? (
            <MonthCalendarGrid
              visibleDate={visibleDate}
              sessions={sessions}
              todayISO={todayISO}
              onDropSession={moveSessionToDate}
            />
          ) : (
            <WeekCalendarGrid
              weekStart={weekStart}
              sessions={sessions}
              todayISO={todayISO}
              onDropSession={moveSessionToDate}
            />
          )}
        </div>
      </section>

      <div className="flex min-w-0 flex-col gap-6">
        <StatutEnvoisCard digest={digest} variant={indicator} />
        <LeCerveauCard brain={brain} onChange={setBrain} />
      </div>
    </div>
  )
}

function StatutEnvoisCard({
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
    [digest.dateISO]
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
              variant === "danger" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
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
            footerOk ? "bg-emerald-500" : variant === "danger" ? "bg-red-500" : "bg-amber-500"
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

function LeCerveauCard({
  brain,
  onChange,
}: {
  brain: BrainReminderState
  onChange: (b: BrainReminderState) => void
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

  const save = () => {
    toast.success("Modifications enregistrées", {
      description: `${brain.rules.filter((r) => r.enabled).length} règle(s) active(s).`,
    })
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
        onClick={save}
      >
        Enregistrer les modifications
      </Button>
    </section>
  )
}

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
        pressed ? "bg-emerald-500" : "bg-neutral-300"
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-1 left-1 size-5 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-200",
          pressed ? "translate-x-5" : "translate-x-0"
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
          : "border-neutral-200 bg-white text-neutral-400 hover:text-neutral-600"
      )}
    >
      {icon}
    </button>
  )
}

function MonthCalendarGrid({
  visibleDate,
  sessions,
  todayISO,
  onDropSession,
}: {
  visibleDate: Date
  sessions: ScheduledSession[]
  todayISO: string
  onDropSession: (sessionId: string, targetISO: string) => void
}) {
  const y = visibleDate.getFullYear()
  const m = visibleDate.getMonth()
  const cells = useMemo(() => getMonthGridCells(y, m), [y, m])

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ScheduledSession[]>()
    for (const s of sessions) {
      const list = map.get(s.dateISO) ?? []
      list.push(s)
      map.set(s.dateISO, list)
    }
    return map
  }, [sessions])

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS_SHORT_FR.map((wd) => (
          <div
            key={wd}
            className="px-1 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-neutral-400"
          >
            {wd}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={`pad-${i}`} className="min-h-[112px] rounded-xl bg-[#f9fafb]" />
          }
          const iso = formatISODate(cell)
          const isToday = iso === todayISO
          const list = sessionsByDate.get(iso) ?? []
          return (
            <div
              key={iso}
              data-date={iso}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
              }}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData(DRAG_TYPE)
                if (id) onDropSession(id, iso)
              }}
              className={cn(
                "flex min-h-[112px] flex-col gap-1 rounded-xl border p-2 transition-colors",
                isToday
                  ? "border-sky-300 bg-sky-50 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.25)]"
                  : "border-neutral-100 bg-white hover:border-neutral-200"
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                  isToday ? "bg-sky-500 text-white shadow-sm" : "text-neutral-600"
                )}
              >
                {cell.getDate()}
              </span>
              <div className="flex min-h-0 flex-1 flex-col gap-1">
                {list.map((s) => (
                  <SessionChip key={s.id} session={s} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekCalendarGrid({
  weekStart,
  sessions,
  todayISO,
  onDropSession,
}: {
  weekStart: Date
  sessions: ScheduledSession[]
  todayISO: string
  onDropSession: (sessionId: string, targetISO: string) => void
}) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => formatISODate(addDays(weekStart, i))),
    [weekStart]
  )

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ScheduledSession[]>()
    for (const s of sessions) {
      const list = map.get(s.dateISO) ?? []
      list.push(s)
      map.set(s.dateISO, list)
    }
    return map
  }, [sessions])

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-7 gap-2">
        {days.map((iso, index) => {
          const d = parseISODateLocal(iso)
          const isToday = iso === todayISO
          const list = sessionsByDate.get(iso) ?? []
          const header = d.toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
          return (
            <div
              key={iso}
              className={cn(
                "flex min-h-[240px] flex-col overflow-hidden rounded-xl border",
                isToday
                  ? "border-sky-300 bg-sky-50 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]"
                  : "border-neutral-100 bg-white"
              )}
            >
              <div
                className={cn(
                  "border-b px-2 py-2.5 text-center text-xs font-semibold capitalize",
                  isToday ? "border-sky-200/80 bg-sky-100/50 text-sky-900" : "border-neutral-100 text-neutral-700"
                )}
              >
                <span className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                  {WEEKDAY_LABELS_SHORT_FR[index]}
                </span>
                {header}
              </div>
              <div
                className="flex flex-1 flex-col gap-2 p-2"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData(DRAG_TYPE)
                  if (id) onDropSession(id, iso)
                }}
              >
                {list.map((s) => (
                  <SessionChip key={s.id} session={s} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function chipPalette(id: string) {
  const i = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 3
  const palettes = [
    {
      wrap: "border-sky-200/90 bg-gradient-to-br from-sky-50 to-white",
      title: "text-sky-950",
      meta: "text-sky-700",
      grip: "text-sky-400",
    },
    {
      wrap: "border-violet-200/90 bg-gradient-to-br from-violet-50 to-white",
      title: "text-violet-950",
      meta: "text-violet-800",
      grip: "text-violet-400",
    },
    {
      wrap: "border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white",
      title: "text-emerald-950",
      meta: "text-emerald-800",
      grip: "text-emerald-500",
    },
  ]
  return palettes[i]!
}

function SessionChip({ session }: { session: ScheduledSession }) {
  const pal = chipPalette(session.id)
  const end = session.endTime ?? session.startTime
  const range = `${session.startTime} - ${end}`

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, session.id)
        e.dataTransfer.effectAllowed = "move"
      }}
      className={cn(
        "flex cursor-grab gap-1 rounded-lg border px-1.5 py-1.5 text-left shadow-sm active:cursor-grabbing",
        pal.wrap
      )}
    >
      <GripVertical className={cn("mt-0.5 size-3.5 shrink-0 opacity-70", pal.grip)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[11px] font-semibold leading-tight", pal.title)}>{session.title}</p>
        <p className={cn("truncate text-[10px] leading-snug", pal.meta)}>
          {range} · {session.groupLabel}
        </p>
      </div>
    </div>
  )
}
