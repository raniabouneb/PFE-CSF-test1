"use client"

import { Calendar, Clock, MapPin, Trash2, Users } from "lucide-react"
import type { SessionDto } from "@/lib/admin/sessions-api"

type Props = {
  session: SessionDto
  onAttendance: (session: SessionDto) => void
  onDelete: (session: SessionDto) => void
}

export default function SessionCard({ session, onAttendance, onDelete }: Props) {
  const dateLabel = new Date(session.date).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const statutColors: Record<string, string> = {
    planifiee: "bg-amber-100 text-amber-700",
    en_cours: "bg-blue-100 text-blue-700",
    terminee: "bg-green-100 text-green-700",
    annulee: "bg-red-100 text-red-700",
  }

  const statutLabels: Record<string, string> = {
    planifiee: "Planifiée",
    en_cours: "En cours",
    terminee: "Terminée",
    annulee: "Annulée",
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-[#0f172a]">
            {session.module?.titre ?? session.titre}
          </h4>
          {session.module && session.titre !== session.module.titre && (
            <p className="truncate text-xs text-neutral-500">{session.titre}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            statutColors[session.statut] ?? "bg-neutral-100 text-neutral-600"
          }`}
        >
          {statutLabels[session.statut] ?? session.statut}
        </span>
      </div>

      {/* Meta */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {dateLabel}
        </span>
        {session.heure_debut && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {session.heure_debut.slice(0, 5)}
            {session.duree_minutes ? ` (${session.duree_minutes} min)` : ""}
          </span>
        )}
        {session.lieu && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {session.lieu}
          </span>
        )}
      </div>

      {/* Groupes badges */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {session.groupes.map((g) => (
          <span
            key={g.id}
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              g.type === "ponctuelle"
                ? "bg-blue-50 text-blue-700"
                : "bg-violet-50 text-violet-700"
            }`}
          >
            {g.nom}
          </span>
        ))}
        {session.groupes.length === 0 && (
          <span className="text-xs text-neutral-400">Aucun groupe</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
        <button
          type="button"
          onClick={() => onAttendance(session)}
          className="flex items-center gap-1.5 rounded-lg bg-[#0D3570] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0a2a5c]"
        >
          <Users className="h-3.5 w-3.5" />
          Présences
        </button>
        {session.statut === "planifiee" && (
          <button
            type="button"
            onClick={() => onDelete(session)}
            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
