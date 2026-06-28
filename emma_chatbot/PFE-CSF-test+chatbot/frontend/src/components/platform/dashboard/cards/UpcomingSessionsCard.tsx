"use client"

import { Calendar, Clock, MapPin, Loader2 } from "lucide-react"
import { usePlanning } from "@/lib/hooks"

export default function UpcomingSessionsCard() {
  const { data: sessions = [], isLoading } = usePlanning()

  const upcoming = sessions.slice(0, 3)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
        <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#1a2a3a]">
          <Calendar className="h-5 w-5 text-[#0D3570]" />
          Prochaines séances
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#1a2a3a]">
        <Calendar className="h-5 w-5 text-[#0D3570]" />
        Prochaines séances
      </h3>

      {upcoming.length === 0 ? (
        <div className="py-8 text-center">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
          <p className="text-sm text-neutral-500">Aucune séance à venir.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((s) => {
            const dateLabel = new Date(s.date).toLocaleDateString("fr-TN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })
            return (
              <div
                key={s.session_id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-slate-50/50 px-4 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0D3570]/10">
                  <Calendar className="h-5 w-5 text-[#0D3570]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1a2a3a]">
                    {s.module_titre ?? s.titre}
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dateLabel}
                    </span>
                    {s.heure_debut && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.heure_debut.slice(0, 5)}
                      </span>
                    )}
                    {s.lieu && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {s.lieu}
                      </span>
                    )}
                  </div>
                </div>
                {s.groupe_nom && (
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    {s.groupe_nom}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
