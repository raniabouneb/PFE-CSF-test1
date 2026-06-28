"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CalendarDays, ExternalLink, Link2, Loader2, Unlink } from "lucide-react"
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
  fetchPlanningOverview,
  savePlanningReminderRules,
  fetchGCalStatus,
  fetchGCalAuthUrl,
  disconnectGCal,
  resolveGCalEmbedUrl,
  type GCalStatus,
} from "@/lib/admin/planning-api"
import { REMINDER_PRESET_HOURS, digestIndicator, formatISODate } from "@/lib/admin/planning-mock"
import { cn } from "@/lib/utils"
import {
  GoogleCalendarCard,
  StatutEnvoisCard,
  LeCerveauCard,
} from "@/components/platform/admin/planning/planning-sidebar-widgets"
import { ModuleSessionSchedulePanel } from "@/components/platform/admin/planning/module-session-schedule-panel"

export function AdminGoogleCalendarBoard() {
  const searchParams = useSearchParams()
  const todayISO = useMemo(() => formatISODate(new Date()), [])

  const [gcalStatus, setGcalStatus] = useState<GCalStatus>({
    connected: false,
    configured: false,
  })
  const [gcalLoading, setGcalLoading] = useState(true)
  const [gcalConnecting, setGcalConnecting] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const [brain, setBrain] = useState<BrainReminderState>({ rules: [] })
  const [digest, setDigest] = useState<DailyNotificationDigest>({
    dateISO: todayISO,
    expectedRuns: 0,
    completedRuns: 0,
    failedRuns: 0,
  })

  const loadSidebar = useCallback(async () => {
    const now = new Date()
    const start = formatISODate(new Date(now.getFullYear(), now.getMonth(), 1))
    const end = formatISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    try {
      const overview = await fetchPlanningOverview({
        startDate: start,
        endDate: end,
        date: todayISO,
      })
      setBrain({ rules: overview.rules })
      setDigest(overview.digest)
    } catch {
      // sidebar optionnelle
    }
  }, [todayISO])

  const refreshGCalStatus = useCallback(async () => {
    setGcalLoading(true)
    try {
      const status = await fetchGCalStatus()
      setGcalStatus(status)
      if (status.connected && resolveGCalEmbedUrl(status)) {
        setIframeKey((k) => k + 1)
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
    void loadSidebar()
  }, [refreshGCalStatus, loadSidebar])

  useEffect(() => {
    const gcal = searchParams.get("gcal")
    if (!gcal) return

    let retryTimer: number | undefined
    if (gcal === "connected") {
      toast.success("Google Calendar connecté", {
        description: "Utilisez l'agenda ci-dessous : création, invitations, rappels, vues…",
      })
      void refreshGCalStatus()
      retryTimer = window.setTimeout(() => void refreshGCalStatus(), 1200)
    } else if (gcal === "error") {
      const reason = searchParams.get("reason") ?? ""
      if (reason.includes("redirect") || reason === "redirect_uri_mismatch") {
        toast.error("redirect_uri_mismatch", {
          description:
            "Ajoutez http://localhost:3000/api/gcal/callback dans Google Cloud Console → Credentials → Authorized redirect URIs, puis redémarrez le backend.",
          duration: 12_000,
        })
      } else {
        toast.error("Connexion Google Calendar échouée", {
          description: reason || undefined,
        })
      }
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("gcal")
      url.searchParams.delete("reason")
      window.history.replaceState({}, "", url.pathname + url.search)
    }

    return () => {
      if (retryTimer) window.clearTimeout(retryTimer)
    }
  }, [searchParams, refreshGCalStatus])

  const indicator = digestIndicator(digest)
  const embedSrc = resolveGCalEmbedUrl(gcalStatus)
  const showGoogle = gcalStatus.connected && Boolean(embedSrc)

  const refreshCalendarAfterSchedule = useCallback(() => {
    setIframeKey((k) => k + 1)
    void refreshGCalStatus()
    void loadSidebar()
  }, [refreshGCalStatus, loadSidebar])

  return (
    <div className="flex flex-col gap-6">
      <ModuleSessionSchedulePanel
        gcalConnected={gcalStatus.connected}
        onScheduled={refreshCalendarAfterSchedule}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)] lg:items-start">
      <section className={cn(ADMIN_DASHBOARD_CARD_CLASS, "min-w-0 p-0 overflow-hidden")}>
        <div className="flex flex-col gap-3 border-b border-neutral-200/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Google Calendar</h2>
            <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
              Créez ou modifiez vos événements ici (clic sur un créneau). Après enregistrement,
              la séance est ajoutée automatiquement dans CSF pour la session-module sélectionnée.
            </p>
          </div>
          {showGoogle ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 text-sm"
                onClick={() => setIframeKey((k) => k + 1)}
              >
                Actualiser
              </Button>
              <Button
                type="button"
                className="h-9 bg-[#0D3570] text-sm font-semibold hover:bg-[#0a2d5c]"
                onClick={() =>
                  window.open(gcalStatus.openUrl ?? "https://calendar.google.com/calendar/r", "_blank")
                }
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Ouvrir dans Google
              </Button>
            </div>
          ) : null}
        </div>

        {gcalLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-neutral-400" />
          </div>
        ) : showGoogle ? (
          <iframe
            key={iframeKey}
            title="Google Calendar"
            src={embedSrc!}
            className="h-[min(82vh,920px)] w-full border-0"
            loading="lazy"
            allow="clipboard-read; clipboard-write"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : gcalStatus.connected ? (
          <div className="flex flex-col items-center justify-center gap-6 px-6 py-20 text-center">
            <CalendarDays className="h-16 w-16 text-emerald-600/50" />
            <div>
              <p className="text-lg font-semibold text-[#0f172a]">Compte connecté</p>
              <p className="mt-2 max-w-md text-sm text-neutral-600">
                L&apos;agenda intégré n&apos;a pas pu se charger. Actualisez ou ouvrez Google Calendar
                dans un nouvel onglet.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 text-sm"
                onClick={() => void refreshGCalStatus()}
              >
                Actualiser l&apos;agenda
              </Button>
              <Button
                type="button"
                className="h-11 bg-[#0D3570] px-6 text-sm font-semibold hover:bg-[#0a2d5c]"
                onClick={() =>
                  window.open(gcalStatus.openUrl ?? "https://calendar.google.com/calendar/r", "_blank")
                }
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir dans Google
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6 px-6 py-20 text-center">
            <CalendarDays className="h-16 w-16 text-[#0D3570]/40" />
            <div>
              <p className="text-lg font-semibold text-[#0f172a]">Connectez Google Calendar</p>
              <p className="mt-2 max-w-md text-sm text-neutral-600">
                L&apos;agenda CSF est remplacé par Google Calendar. Vous aurez toutes les fonctions
                Google : nouvel événement, participants, notifications, changement de vue, etc.
              </p>
            </div>
            {!gcalStatus.configured ? (
              <p className="text-sm text-amber-700">Clés Google manquantes côté serveur.</p>
            ) : (
              <Button
                type="button"
                className="h-11 bg-[#0D3570] px-6 text-sm font-semibold hover:bg-[#0a2d5c]"
                disabled={gcalConnecting}
                onClick={async () => {
                  setGcalConnecting(true)
                  try {
                    window.location.href = await fetchGCalAuthUrl()
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Connexion impossible")
                    setGcalConnecting(false)
                  }
                }}
              >
                {gcalConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" />
                )}
                Connecter Google Calendar
              </Button>
            )}
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-6">
        <GoogleCalendarCard
          status={gcalStatus}
          loading={gcalLoading}
          connecting={gcalConnecting}
          onConnect={async () => {
            setGcalConnecting(true)
            try {
              window.location.href = await fetchGCalAuthUrl()
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
            const saved = await savePlanningReminderRules(rules)
            setBrain({ rules: saved })
            toast.success("Rappels enregistrés (appliqués aux séances synchronisées depuis CSF)")
          }}
        />
      </aside>
      </div>
    </div>
  )
}
