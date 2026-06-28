"use client"

import { Plus, Users } from "lucide-react"
import { ADMIN_DASHBOARD_CARD_CLASS } from "@/lib/admin/dashboard-card-styles"
import {
  type ApprenantFiltersPayload,
  type ApprenantFormat,
  type GroupSummaryDto,
} from "@/lib/admin/apprenants-api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GroupsGridProps {
  filteredGroups: GroupSummaryDto[]
  filtersPayload: ApprenantFiltersPayload | null
  mainFormat: "all" | ApprenantFormat
  rcTopicSlug: string
  pnFormationSlug: string
  setMainFormatAndResetSubs: (v: "all" | ApprenantFormat) => void
  setRcTopicSlug: (v: string) => void
  setPnFormationSlug: (v: string) => void
  resetFilters: () => void
  onGroupSelect: (groupId: string) => void
  onCreateGroup: () => void
}

export default function GroupsGrid({
  filteredGroups,
  filtersPayload,
  mainFormat,
  rcTopicSlug,
  pnFormationSlug,
  setMainFormatAndResetSubs,
  setRcTopicSlug,
  setPnFormationSlug,
  resetFilters,
  onGroupSelect,
  onCreateGroup,
}: GroupsGridProps) {
  const rcTopics = filtersPayload?.reconversionTopics ?? []
  const pnForms = filtersPayload?.ponctuelleFormations ?? []

  const filterActive =
    mainFormat !== "all" || rcTopicSlug !== "all" || pnFormationSlug !== "all"

  const getStatutBadge = (statut: GroupSummaryDto["status"]) => {
    switch (statut) {
      case "pending":
        return "bg-amber-100 text-amber-900 border-amber-200"
      case "active":
        return "bg-[#4caf50]/15 text-[#2e7d32] border-[#4caf50]/30"
      case "terminee":
        return "bg-[#008080]/15 text-[#006666] border-[#008080]/30"
      case "suspendue":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatutLabel = (statut: GroupSummaryDto["status"]) => {
    switch (statut) {
      case "pending":
        return "En attente"
      case "active":
        return "En cours"
      case "terminee":
        return "Terminée"
      case "suspendue":
        return "Suspendue"
      default:
        return statut
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-[#4caf50]"
    if (progress >= 60) return "bg-[#008080]"
    if (progress >= 40) return "bg-[#ffeb3b]"
    return "bg-[#ff9800]"
  }

  return (
    <section aria-labelledby="apprenants-groupes-heading">
      <div className={cn(ADMIN_DASHBOARD_CARD_CLASS, "overflow-hidden p-0")}>
        <div className="space-y-4 p-5 sm:space-y-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="min-w-0">
              <h2 id="apprenants-groupes-heading" className="text-lg font-semibold text-[#0f172a]">
                Groupes
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Filtrez par format comme sur le catalogue (Reconversion : parcours, Ponctuelle : domaines), puis
                gérez chaque groupe.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {filterActive ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-[#0f172a] transition-colors hover:bg-neutral-50"
                >
                  Réinitialiser les filtres
                </button>
              ) : null}
              <Button type="button" className="bg-[#0D3570] hover:bg-[#0a2a5c]" onClick={onCreateGroup}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter un groupe
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Tous"],
                ["reconversion", "Reconversion"],
                ["ponctuelle", "Ponctuelle"],
                ["sur_mesure", "Sur mesure"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMainFormatAndResetSubs(key)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  mainFormat === key
                    ? "border-[#0D3570] bg-[#0D3570] text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {mainFormat === "reconversion" ? (
            <div className="rounded-xl border border-neutral-200/80 bg-white/60 p-3 sm:p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0c2744]">
                Reconversion — parcours
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRcTopicSlug("all")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    rcTopicSlug === "all"
                      ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  )}
                >
                  Tous les parcours
                </button>
                {rcTopics.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRcTopicSlug(id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      rcTopicSlug === id
                        ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mainFormat === "ponctuelle" ? (
            <div className="rounded-xl border border-neutral-200/80 bg-white/60 p-3 sm:p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0c2744]">
                Ponctuelle — domaine
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPnFormationSlug("all")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    pnFormationSlug === "all"
                      ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  )}
                >
                  Toutes les formations
                </button>
                {pnForms.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPnFormationSlug(id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      pnFormationSlug === id
                        ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-neutral-200/80 bg-white/30">
          <div className="space-y-4 p-5 sm:p-6">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-neutral-200/90 bg-[#f4f7fb] p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between lg:flex-col lg:justify-center">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold leading-snug text-[#1a2a3a]">{group.name}</h3>
                      <p className="mt-1 text-sm text-[#6b7280]">{group.formationLabel}</p>
                    </div>
                    <span
                      className={`inline-flex w-fit shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatutBadge(group.status)}`}
                    >
                      {getStatutLabel(group.status)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-neutral-200/70 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-10 sm:gap-y-4 sm:border-t-0 sm:pt-0 lg:flex-nowrap lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                    <div className="flex min-w-[7rem] items-baseline gap-2 sm:flex-col sm:gap-0">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                        Apprenants
                      </span>
                      <span className="text-lg font-semibold tabular-nums text-[#1a2a3a]">
                        {group.memberCount}
                      </span>
                    </div>
                    <div className="flex min-w-[9rem] items-baseline gap-2 sm:flex-col sm:gap-0">
                      <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">Début</span>
                      <span className="text-sm font-semibold tabular-nums text-[#1a2a3a]">
                        {group.startDate ? new Date(group.startDate).toLocaleDateString("fr-FR") : "—"}
                      </span>
                    </div>
                    <div className="min-w-[min(100%,14rem)] flex-1 sm:min-w-[12rem] lg:max-w-xs lg:flex-1">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                          Progression moy.
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-[#1a2a3a]">
                          {group.progressAverage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                        <div
                          className={`h-full rounded-full transition-all ${getProgressColor(group.progressAverage)}`}
                          style={{ width: `${group.progressAverage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 justify-stretch border-t border-neutral-200/70 pt-4 sm:justify-end lg:flex-col lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                    <button
                      type="button"
                      onClick={() => onGroupSelect(group.id)}
                      className="w-full whitespace-nowrap rounded-md bg-[#1a3d5d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2c5282] sm:w-auto"
                    >
                      Gérer le groupe
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredGroups.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-[#6b7280]" />
                <h3 className="mb-2 text-lg font-medium text-[#1a2a3a]">Aucun groupe trouvé</h3>
                <p className="text-[#6b7280]">Modifiez les filtres pour voir plus de résultats.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
