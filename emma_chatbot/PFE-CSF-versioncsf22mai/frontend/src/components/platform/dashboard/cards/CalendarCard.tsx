"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Calendar, Clock, ExternalLink, Link2, Loader2, Mail, MapPin } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { usePlanning } from "@/lib/hooks"
import { useLearnerGCalStatus, fetchLearnerGCalAuthUrl } from "@/lib/hooks/learner/useLearnerGCal"
import {
  GOOGLE_CALENDAR_OPEN_URL,
  buildGoogleCalendarEmbedUrl,
} from "@/lib/google-calendar-embed"
import { resolveLearnerCalendarEmbedUrl } from "@/lib/learner-google-calendar"

function formatSessionDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function sessionDateBadge(dateStr: string): { month: string; day: number } {
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return { month: "—", day: 0 }
  return {
    month: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "").toUpperCase(),
    day: d.getDate(),
  }
}

function formatTimeRange(heure: string | null, dureeMinutes: number | null): string {
  if (!heure) return ""
  const start = heure.slice(0, 5)
  if (!dureeMinutes || dureeMinutes <= 0) return start
  const [h, m] = start.split(":").map(Number)
  const total = h * 60 + m + dureeMinutes
  const end = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
  return `${start} – ${end}`
}

export default function CalendarCard() {
  const searchParams = useSearchParams()
  const { data: sessions = [], isLoading } = usePlanning()
  const { data: gcalStatus, isLoading: gcalLoading, refetch: refetchGcal } = useLearnerGCalStatus()
  const [connecting, setConnecting] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const upcoming = sessions.slice(0, 5)

  const publicEmbed = resolveLearnerCalendarEmbedUrl()
  const connectedEmbed =
    gcalStatus?.connected && gcalStatus.calendarId
      ? gcalStatus.embedUrl ?? buildGoogleCalendarEmbedUrl(gcalStatus.calendarId, "MONTH")
      : null
  const embedUrl = connectedEmbed ?? publicEmbed
  const showIframe = Boolean(embedUrl)
  const openUrl = gcalStatus?.openUrl ?? GOOGLE_CALENDAR_OPEN_URL

  useEffect(() => {
    const gcal = searchParams.get("gcal")
    if (gcal === "connected") {
      toast.success("Google Calendar connecté", {
        description: "Votre agenda s’affiche ci-dessous comme dans l’espace admin.",
      })
      void refetchGcal()
      setIframeKey((k) => k + 1)
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.delete("gcal")
        url.searchParams.delete("reason")
        window.history.replaceState({}, "", url.pathname + url.search)
      }
    } else if (gcal === "error") {
      toast.error("Connexion Google Calendar échouée")
    }
  }, [searchParams, refetchGcal])

  const handleConnect = useCallback(async () => {
    setConnecting(true)
    try {
      window.location.href = await fetchLearnerGCalAuthUrl()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Connexion impossible")
      setConnecting(false)
    }
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#e5e7eb] bg-gradient-to-r from-[#0D3570] to-[#1a5a9e] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 shrink-0 opacity-95" strokeWidth={1.75} />
          <div>
            <h3 className="text-sm font-semibold">Google Calendar</h3>
            <p className="text-xs text-white/85">Vos séances CSF et réponses aux invitations</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {showIframe ? (
            <Button
              type="button"
              variant="secondary"
              className="h-9 shrink-0 border-0 bg-white/15 text-xs font-semibold text-white hover:bg-white/25"
              onClick={() => setIframeKey((k) => k + 1)}
            >
              Actualiser
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="h-9 shrink-0 border-0 bg-white/15 text-xs font-semibold text-white hover:bg-white/25"
            onClick={() => window.open(openUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="mr-1.5 h-4 w-4" />
            Ouvrir dans Google Calendar
          </Button>
        </div>
      </div>

      <div className="border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-[#475569]">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0D3570]" />
          <span>
            Chaque séance déclenche une <strong>notification CSF</strong> (cloche en haut à droite + e-mail
            brandé si SMTP est configuré) et une <strong>invitation Google Calendar</strong>. Connectez
            le même compte Gmail que votre profil CSF pour l&apos;agenda ci-dessous.
          </span>
        </p>
      </div>

      {gcalStatus?.emailMismatch ? (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          Agenda Google connecté ({gcalStatus.calendarId}) différent de votre profil (
          {gcalStatus.profileEmail}). Connectez le compte qui reçoit les invitations CSF, ou consultez
          l&apos;e-mail d&apos;invitation.
        </p>
      ) : null}

      {gcalLoading ? (
        <div className="flex justify-center border-b border-[#e5e7eb] py-16">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : showIframe ? (
        <div className="border-b border-[#e5e7eb]">
          <iframe
            key={iframeKey}
            title="Google Calendar — séances CSF"
            src={embedUrl!}
            className="h-[min(62vh,520px)] w-full border-0 bg-white"
            loading="lazy"
            allow="clipboard-read; clipboard-write"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="border-b border-[#e5e7eb] bg-[#f1f3f4] px-4 py-6 text-center">
          <Calendar className="mx-auto mb-2 h-10 w-10 text-[#1a73e8]" />
          <p className="text-sm font-medium text-[#1a2a3a]">Afficher votre agenda Google ici</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-neutral-600">
            Même vue que l&apos;espace admin : connectez le compte Google qui reçoit les invitations
            CSF ({gcalStatus?.configured === false ? "OAuth non configuré côté serveur" : "connexion requise"}).
          </p>
          {gcalStatus?.configured !== false ? (
            <Button
              type="button"
              className="mt-4 h-10 bg-[#1a73e8] text-sm font-semibold hover:bg-[#1557b0]"
              disabled={connecting}
              onClick={() => void handleConnect()}
            >
              {connecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Connecter Google Calendar
            </Button>
          ) : null}
        </div>
      )}

      <div id="seances-csf" className="flex flex-1 flex-col p-5 scroll-mt-24">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
          Prochaines séances CSF
        </h4>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 bg-[#f9fafb] py-8 text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
            <p className="text-sm text-neutral-500">Aucune séance à venir pour le moment.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((s) => {
              const badge = sessionDateBadge(s.date)
              return (
                <li
                  key={s.session_id}
                  className="flex gap-3 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-3"
                >
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-center shadow-sm">
                    <span className="text-[9px] font-semibold uppercase leading-none text-[#64748b]">
                      {badge.month}
                    </span>
                    <span className="text-sm font-bold leading-tight text-[#0D3570]">{badge.day}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-[#1a2a3a]">
                      {s.module_titre ?? s.titre}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatSessionDate(s.date)}
                      </span>
                      {s.heure_debut ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeRange(s.heure_debut, s.duree_minutes)}
                        </span>
                      ) : null}
                      {s.lieu ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {s.lieu}
                        </span>
                      ) : null}
                    </div>
                    {s.groupe_nom ? (
                      <p className="mt-1 text-[10px] font-medium text-[#0D3570]/80">{s.groupe_nom}</p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p className="mt-4 text-center text-[10px] text-neutral-500">
          Notifications CSF : cloche du tableau de bord. Google : réponse Oui / Non / Peut-être via
          l’invitation Calendar.
        </p>
      </div>
    </div>
  )
}
