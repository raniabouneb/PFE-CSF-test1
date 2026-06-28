'use client'

import { useCallback, useRef, useState } from 'react'
import { Calendar, Clock, ExternalLink, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

import { usePlanning } from '@/lib/hooks'
import { useLearnerGCalStatus, fetchLearnerGCalAuthUrl } from '@/lib/hooks/learner/useLearnerGCal'
import { GOOGLE_CALENDAR_OPEN_URL } from '@/lib/google-calendar-embed'
import type { SessionPlanifiee } from '@/types/learner'
import SessionsMiniCalendar from './SessionsMiniCalendar'

function formatSessionDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function sessionDateBadge(dateStr: string): { month: string; day: number } {
  const d = new Date(`${dateStr}T12:00:00`)
  if (Number.isNaN(d.getTime())) return { month: '—', day: 0 }
  return {
    month: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase(),
    day: d.getDate(),
  }
}

function formatTimeRange(heure: string | null, dureeMinutes: number | null): string {
  if (!heure) return ''
  const start = heure.slice(0, 5)
  if (!dureeMinutes || dureeMinutes <= 0) return start
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + dureeMinutes
  const end = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  return `${start} – ${end}`
}

function SessionRow({
  session,
  highlighted,
  cardRef,
}: {
  session: SessionPlanifiee
  highlighted: boolean
  cardRef: (el: HTMLLIElement | null) => void
}) {
  const badge = sessionDateBadge(session.date)
  const title = session.module_titre ?? session.titre

  return (
    <li
      ref={cardRef}
      className={[
        'flex gap-3 rounded-2xl border px-3 py-3 transition-all duration-300',
        highlighted
          ? 'border-[#0D3570]/60 bg-[#0D3570]/10 shadow-md scale-[1.02]'
          : 'border-[#e5e7eb] bg-white/60',
      ].join(' ')}
    >
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-[#e5e7eb] bg-white/80 text-center">
        <span className="text-[9px] font-semibold uppercase leading-none text-[#64748b]">
          {badge.month}
        </span>
        <span className="text-sm font-bold leading-tight text-[#0D3570]">{badge.day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-[#1a2a3a]">{title}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#64748b]">
          <span className="flex items-center gap-1">
            <Calendar className="size-3 shrink-0" aria-hidden />
            {formatSessionDate(session.date)}
          </span>
          {session.heure_debut ? (
            <span className="flex items-center gap-1">
              <Clock className="size-3 shrink-0" aria-hidden />
              {formatTimeRange(session.heure_debut, session.duree_minutes)}
            </span>
          ) : null}
          {session.lieu ? (
            <span className="flex items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              {session.lieu}
            </span>
          ) : null}
        </div>
        {session.groupe_nom ? (
          <p className="mt-1 text-[10px] font-medium text-[#0D3570]">{session.groupe_nom}</p>
        ) : null}
      </div>
    </li>
  )
}

export default function DashboardSessionsCard() {
  const { data: sessions = [], isLoading } = usePlanning()
  const { data: gcalStatus } = useLearnerGCalStatus()
  const [connecting, setConnecting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const cardRefs = useRef<Map<string, HTMLLIElement>>(new Map())

  const upcoming = sessions.slice(0, 5)
  const openUrl = gcalStatus?.openUrl ?? GOOGLE_CALENDAR_OPEN_URL

  const handleConnect = useCallback(async () => {
    setConnecting(true)
    try {
      window.location.href = await fetchLearnerGCalAuthUrl()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Connexion impossible')
      setConnecting(false)
    }
  }, [])

  const handleCalendarDateClick = useCallback(
    (date: string) => {
      setSelectedDate(date)
      const firstSession = upcoming.find((s) => s.date === date)
      if (firstSession) {
        const el = cardRefs.current.get(firstSession.session_id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
      setTimeout(() => setSelectedDate(null), 2500)
    },
    [upcoming],
  )

  return (
    <section className="flex flex-col gap-4 border-t border-white/35 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold uppercase tracking-wider text-[#64748b]">
            Google Calendar
          </h3>
          <p className="mt-0.5 text-[14px] text-[#64748b]">Prochaines séances CSF</p>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-[#0B264F] transition hover:underline"
          onClick={() => window.open(openUrl, '_blank', 'noopener,noreferrer')}
        >
          Ouvrir
          <ExternalLink size={14} aria-hidden />
        </button>
      </div>

      {gcalStatus?.configured !== false && !gcalStatus?.connected ? (
        <p className="text-xs leading-relaxed text-[#64748b]">
          Connectez Google Calendar pour synchroniser vos invitations CSF.{' '}
          <button
            type="button"
            className="font-semibold text-[#0B264F] underline-offset-2 hover:underline"
            disabled={connecting}
            onClick={() => void handleConnect()}
          >
            {connecting ? 'Connexion…' : 'Connecter'}
          </button>
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-[#94a3b8]" aria-hidden />
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/30 bg-white/20 p-3 backdrop-blur-sm">
            <SessionsMiniCalendar sessions={upcoming} onDateClick={handleCalendarDateClick} />
          </div>

          {upcoming.length === 0 ? (
            <p className="text-center text-xs text-[#64748b]">
              Aucune séance à venir — le calendrier affiche le mois en cours.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((s) => (
                <SessionRow
                  key={s.session_id}
                  session={s}
                  highlighted={selectedDate === s.date}
                  cardRef={(el) => {
                    if (el) cardRefs.current.set(s.session_id, el)
                    else cardRefs.current.delete(s.session_id)
                  }}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
