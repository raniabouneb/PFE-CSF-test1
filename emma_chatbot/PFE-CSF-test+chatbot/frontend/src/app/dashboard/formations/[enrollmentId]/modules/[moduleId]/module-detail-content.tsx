"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ArrowLeft, FileText, Calendar, Clock, MapPin, Download, Loader2, BookOpen } from "lucide-react"
import { useModuleDetail } from "@/lib/hooks"
import type { SessionPlanifiee, SupportItem } from "@/types/learner"

type Props = {
  enrollmentId: string
  moduleId: string
}

const statutLabel: Record<string, { text: string; cls: string }> = {
  open: { text: "En cours", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80" },
  in_progress: { text: "En cours", cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80" },
  done: { text: "Terminé", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80" },
  completed: { text: "Terminé", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80" },
  locked: { text: "Verrouillé", cls: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80" },
  not_started: { text: "Non commencé", cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80" },
}

const sessionStatut: Record<string, { text: string; cls: string }> = {
  planifiee: { text: "Planifiée", cls: "bg-amber-100 text-amber-700" },
  planned: { text: "Planifiée", cls: "bg-amber-100 text-amber-700" },
  en_cours: { text: "En cours", cls: "bg-blue-100 text-blue-700" },
  terminee: { text: "Terminée", cls: "bg-green-100 text-green-700" },
  completed: { text: "Terminée", cls: "bg-green-100 text-green-700" },
  annulee: { text: "Annulée", cls: "bg-red-100 text-red-700" },
  cancelled: { text: "Annulée", cls: "bg-red-100 text-red-700" },
}

export default function ModuleDetailContent({ enrollmentId, moduleId }: Props) {
  const router = useRouter()
  const { data: module, isLoading, isError, error } = useModuleDetail(enrollmentId, moduleId)

  useEffect(() => {
    if (isError && error && "status" in error && (error as { status: number }).status === 403) {
      router.replace("/dashboard/formations")
    }
  }, [isError, error, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (isError || !module) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 py-12 text-center">
        <p className="mb-3 text-sm text-red-700">
          {isError && error && "status" in error && (error as { status: number }).status === 403
            ? "Ce module est verrouillé."
            : "Impossible de charger le module."}
        </p>
        <Link
          href="/dashboard/formations"
          className="inline-block rounded-lg bg-[#0D3570] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a2a5c]"
        >
          Retour aux formations
        </Link>
      </div>
    )
  }

  const progressPercent =
    module.duree_minutes && module.duree_minutes > 0
      ? Math.min(Math.round((module.minutes_validees / module.duree_minutes) * 100), 100)
      : null

  return (
    <>
      <Link
        href="/dashboard/formations"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#0D3570] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux formations
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-6 lg:col-span-8">
          {/* Module header */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#1a2a3a]">{module.titre}</h2>
                {module.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{module.description}</p>
                )}
              </div>
              {module.statut && statutLabel[module.statut] && (
                <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${statutLabel[module.statut].cls}`}>
                  {statutLabel[module.statut].text}
                </span>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-gray-100 bg-slate-50/90 p-4">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {module.duree_minutes != null && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Durée totale</p>
                    <p className="mt-1 text-base font-semibold text-[#1a2a3a]">{module.duree_minutes} min</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Minutes validées</p>
                  <p className="mt-1 text-base font-semibold text-[#1a2a3a]">{module.minutes_validees} min</p>
                </div>
                {progressPercent != null && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progression</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-base font-semibold tabular-nums text-[#1a2a3a]">
                        {progressPercent}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Supports de cours */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#1a2a3a]">
              <BookOpen className="h-5 w-5 text-[#0D3570]" />
              Supports de cours
            </h3>

            {module.supports && module.supports.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {module.supports.map((support) => (
                  <SupportCard key={support.id} support={support} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                <p className="text-sm text-neutral-500">Aucun support disponible pour ce module.</p>
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#1a2a3a]">
              <Calendar className="h-5 w-5 text-[#0D3570]" />
              Mes séances
            </h3>

            {module.sessions.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                <p className="text-sm text-neutral-500">Aucune séance planifiée pour ce module.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {module.sessions.map((session) => (
                  <SessionRow key={session.session_id} session={session} />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#1a2a3a]">Récapitulatif</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-neutral-500">Module</dt>
                <dd className="text-sm font-medium text-[#1a2a3a]">{module.titre}</dd>
              </div>
              {module.duree_minutes != null && (
                <div className="flex justify-between">
                  <dt className="text-sm text-neutral-500">Durée</dt>
                  <dd className="text-sm font-medium text-[#1a2a3a]">{module.duree_minutes} min</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-neutral-500">Validé</dt>
                <dd className="text-sm font-medium text-[#1a2a3a]">{module.minutes_validees} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-neutral-500">Séances</dt>
                <dd className="text-sm font-medium text-[#1a2a3a]">{module.sessions.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-neutral-500">Supports</dt>
                <dd className="text-sm font-medium text-[#1a2a3a]">{module.supports?.length ?? 0}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  )
}

function SupportCard({ support }: { support: SupportItem }) {
  const displayName = support.file_name
    .replace(/\.pdf$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return (
    <div className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-4 transition hover:border-[#0D3570]/30 hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
        <FileText className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-[#1a2a3a] line-clamp-2">
          {displayName || "Document PDF"}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">PDF</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <a
          href={support.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-[#0D3570] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#0a2a5c]"
        >
          <Download className="h-3.5 w-3.5" />
          Ouvrir
        </a>
      </div>
    </div>
  )
}

function SessionRow({ session }: { session: SessionPlanifiee }) {
  const dateLabel = new Date(session.date).toLocaleDateString("fr-TN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const st = sessionStatut[session.statut]

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-slate-50/50 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0D3570]/10">
        <Calendar className="h-5 w-5 text-[#0D3570]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#1a2a3a]">{session.titre}</p>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {dateLabel}
          </span>
          {session.heure_debut && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {session.heure_debut.slice(0, 5)}
              {session.duree_minutes ? ` (${session.duree_minutes} min)` : ""}
            </span>
          )}
          {session.lieu && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {session.lieu}
            </span>
          )}
        </div>
      </div>
      {st && (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${st.cls}`}>
          {st.text}
        </span>
      )}
    </div>
  )
}
