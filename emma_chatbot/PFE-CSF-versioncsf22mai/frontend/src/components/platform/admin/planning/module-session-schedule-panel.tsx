"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CalendarPlus, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ADMIN_DASHBOARD_CARD_CLASS,
  ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS,
  ADMIN_DASHBOARD_CARD_TITLE_CLASS,
} from "@/lib/admin/dashboard-card-styles"
import {
  DEFAULT_PLANNING_LOCATION,
  autoLinkGoogleEventToModuleSession,
  type GCalEventItem,
} from "@/lib/admin/planning-api"
import {
  buildGoogleCalendarComposeUrl,
  defaultComposeSlot,
} from "@/lib/admin/google-calendar-compose"
import { buildCsfLinkMarker } from "@/lib/google-calendar-embed"
import {
  fetchModuleSessionMembers,
  fetchModuleSessions,
  type ModuleAccessInfo,
  type ModuleSessionSummary,
} from "@/lib/admin/apprenants-api"
import { cn } from "@/lib/utils"

type Props = {
  gcalConnected: boolean
  onScheduled: () => void
}

function accessKindLabel(kind: ModuleAccessInfo["accessKind"]): string {
  return kind === "reconversion_module" ? "Reconversion" : "Ponctuelle"
}

function formatEventWhen(ev: GCalEventItem): string {
  const d = new Date(`${ev.date}T12:00:00`)
  const dateLabel = Number.isNaN(d.getTime())
    ? ev.date
    : d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })
  return `${dateLabel} · ${ev.startTime} (${ev.durationMinutes} min)`
}

const AUTO_LINK_POLL_MS = 5000

export function ModuleSessionSchedulePanel({ gcalConnected, onScheduled }: Props) {
  const [sessions, setSessions] = useState<ModuleSessionSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [groupId, setGroupId] = useState("")
  const [accessId, setAccessId] = useState("")
  const [openingGcal, setOpeningGcal] = useState(false)
  const [autoLinking, setAutoLinking] = useState(false)
  const [candidates, setCandidates] = useState<GCalEventItem[]>([])
  const [syncHint, setSyncHint] = useState<string | null>(null)

  const watchSinceRef = useRef<string | null>(null)
  const linkedRef = useRef(false)

  const selectedSession = useMemo(
    () => sessions.find((s) => s.groupId === groupId) ?? null,
    [sessions, groupId],
  )

  const selectedAccess = useMemo(() => {
    if (!selectedSession) return null
    if (accessId) {
      return selectedSession.accesses.find((a) => a.id === accessId) ?? null
    }
    return selectedSession.accesses[0] ?? null
  }, [selectedSession, accessId])

  const showModulePicker = (selectedSession?.accesses.length ?? 0) > 1

  const loadSessions = useCallback(async () => {
    setLoadingList(true)
    try {
      const items = await fetchModuleSessions()
      setSessions(items)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de charger les sessions-modules.")
      setSessions([])
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (!selectedSession) {
      setAccessId("")
      return
    }
    const first = selectedSession.accesses[0]
    if (first) setAccessId(first.id)
  }, [selectedSession])

  const resetWatch = useCallback(() => {
    watchSinceRef.current = new Date(Date.now() - 10 * 60_000).toISOString()
    linkedRef.current = false
    setCandidates([])
    setSyncHint(null)
  }, [])

  useEffect(() => {
    if (groupId) resetWatch()
  }, [groupId, accessId, resetWatch])

  const tryAutoLink = useCallback(
    async (opts?: { googleEventId?: string; manual?: boolean }) => {
      if (!gcalConnected || !selectedSession || !selectedAccess || linkedRef.current) return
      const gid = Number.parseInt(selectedSession.groupId, 10)
      const since = watchSinceRef.current
      if (!Number.isFinite(gid) || !since) return

      setAutoLinking(true)
      try {
        const result = await autoLinkGoogleEventToModuleSession({
          groupId: gid,
          moduleTargetRef: selectedAccess.moduleRef,
          moduleLabel: selectedAccess.moduleLabel,
          sessionLabel: selectedSession.sessionLabel,
          sinceIso: since,
          googleEventId: opts?.googleEventId,
        })
        if (result.linked) {
          linkedRef.current = true
          setCandidates([])
          setSyncHint(null)
          toast.success("Séance enregistrée dans CSF", {
            description: "Synchronisation depuis Google Calendar.",
          })
          onScheduled()
          void loadSessions()
          return
        }
        const list = result.candidates ?? []
        setCandidates(list)
        setSyncHint(result.message ?? null)
        if (opts?.manual && list.length === 0) {
          toast.message("Aucun événement détecté", {
            description:
              result.message ??
              "Créez l'événement dans l'agenda connecté (compte admin), puis réessayez.",
          })
        }
      } catch (e) {
        if (opts?.manual) {
          toast.error(e instanceof Error ? e.message : "Synchronisation impossible.")
        }
      } finally {
        setAutoLinking(false)
      }
    },
    [gcalConnected, selectedSession, selectedAccess, onScheduled, loadSessions],
  )

  useEffect(() => {
    if (!gcalConnected || !groupId || !selectedAccess) return
    const id = window.setInterval(() => void tryAutoLink(), AUTO_LINK_POLL_MS)
    return () => window.clearInterval(id)
  }, [gcalConnected, groupId, selectedAccess, tryAutoLink])

  useEffect(() => {
    const onFocus = () => void tryAutoLink()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [tryAutoLink])

  const openGoogleToPlan = async () => {
    if (!selectedSession || !selectedAccess) {
      toast.error("Choisissez d'abord une session-module et un module.")
      return
    }
    if (!gcalConnected) {
      toast.error("Connectez Google Calendar dans le panneau à droite.")
      return
    }

    const gid = Number.parseInt(selectedSession.groupId, 10)
    if (!Number.isFinite(gid)) return

    resetWatch()
    setOpeningGcal(true)
    try {
      const members = await fetchModuleSessionMembers(selectedSession.groupId)
      const emails = members.map((m) => m.email).filter(Boolean)
      const { start, end } = defaultComposeSlot()
      const title = `${selectedAccess.moduleLabel} — ${selectedSession.sessionLabel}`
      const marker = buildCsfLinkMarker(gid, selectedAccess.moduleRef)
      const details = [
        `Module : ${selectedAccess.moduleLabel}`,
        `Session-module : ${selectedSession.sessionLabel}`,
        marker,
        "",
        "Séance CSF — enregistrement automatique dans la plateforme après sauvegarde dans Google Calendar.",
      ].join("\n")

      const url = buildGoogleCalendarComposeUrl({
        title,
        details,
        location: DEFAULT_PLANNING_LOCATION,
        start,
        end,
        attendeeEmails: emails,
      })
      window.open(url, "_blank", "noopener,noreferrer")
      toast.message("Enregistrez l'événement dans Google Calendar", {
        description: "La séance sera ajoutée automatiquement dans CSF (quelques secondes).",
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ouverture Google Calendar impossible.")
    } finally {
      setOpeningGcal(false)
    }
  }

  const watching =
    gcalConnected && Boolean(groupId) && Boolean(selectedAccess) && !linkedRef.current

  return (
    <section className={cn(ADMIN_DASHBOARD_CARD_CLASS, "min-w-0")}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D3570]/10">
          <CalendarPlus className="h-5 w-5 text-[#0D3570]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Planifier via Google Calendar</h2>
          <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
            Choisissez la session-module, créez l&apos;événement dans l&apos;agenda ci-dessous (ou
            via le bouton). Dès que vous l&apos;enregistrez dans Google, la séance est créée dans CSF
            automatiquement.
          </p>
        </div>
      </div>

      {loadingList ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white/60 px-4 py-6 text-center text-sm text-neutral-600">
          Aucune session-module. Créez-en une dans{" "}
          <span className="font-medium text-[#0D3570]">Gestion des Apprenants</span>.
        </p>
      ) : (
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-neutral-700">Session-module</span>
            <select
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-[#0D3570] focus:ring-2"
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value)
                setAccessId("")
                linkedRef.current = false
              }}
              required
            >
              <option value="">— Choisir —</option>
              {sessions.map((s) => (
                <option key={s.groupId} value={s.groupId}>
                  {s.sessionLabel} ({s.memberCount} apprenant{s.memberCount !== 1 ? "s" : ""},{" "}
                  {s.sessionCount} séance{s.sessionCount !== 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </label>

          {showModulePicker && selectedSession ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-neutral-700">Module de la séance</span>
              <select
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-[#0D3570] focus:ring-2"
                value={accessId}
                onChange={(e) => {
                  setAccessId(e.target.value)
                  linkedRef.current = false
                }}
                required
              >
                {selectedSession.accesses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {accessKindLabel(a.accessKind)} · {a.moduleLabel}
                  </option>
                ))}
              </select>
            </label>
          ) : selectedAccess ? (
            <p className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
              <span className="font-medium">Module :</span> {accessKindLabel(selectedAccess.accessKind)}{" "}
              · {selectedAccess.moduleLabel}
            </p>
          ) : null}

          {watching ? (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {autoLinking ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
              )}
              Après enregistrement dans l&apos;agenda Google (compte connecté à droite), cliquez{" "}
              <strong>Synchroniser avec CSF</strong>.
            </p>
          ) : null}

          {syncHint && candidates.length > 0 ? (
            <p className="text-xs text-amber-800">{syncHint}</p>
          ) : null}

          {candidates.length > 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3">
              <p className="mb-2 text-sm font-medium text-[#0f172a]">
                Choisissez l&apos;événement Google à lier
              </p>
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {candidates.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{ev.summary}</p>
                      <p className="text-xs text-neutral-500">{formatEventWhen(ev)}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 shrink-0 bg-[#0D3570] text-xs hover:bg-[#0a2d5c]"
                      disabled={autoLinking}
                      onClick={() => void tryAutoLink({ googleEventId: ev.id, manual: true })}
                    >
                      Lier à CSF
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              disabled={!groupId || !gcalConnected || openingGcal}
              className="h-10 bg-[#0D3570] px-5 text-sm font-semibold hover:bg-[#0a2d5c]"
              onClick={() => void openGoogleToPlan()}
            >
              {openingGcal ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Nouvel événement Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!groupId || !gcalConnected || autoLinking}
              className="h-10 text-sm"
              onClick={() => void tryAutoLink({ manual: true })}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", autoLinking && "animate-spin")} />
              Synchroniser avec CSF
            </Button>
            {!gcalConnected ? (
              <span className="text-xs text-neutral-500">
                Connectez Google Calendar à droite pour planifier.
              </span>
            ) : null}
          </div>
        </div>
      )}
    </section>
  )
}
