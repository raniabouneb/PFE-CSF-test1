"use client"

import { AdminGlassKpiCard } from "@/components/platform/admin/dashboard/admin-glass-kpi-card"
import type { GroupSummaryDto } from "@/lib/admin/apprenants-api"

interface ApprenantsKPIsProps {
  groups: GroupSummaryDto[]
  filterActive: boolean
}

export default function ApprenantsKPIs({ groups, filterActive }: ApprenantsKPIsProps) {
  const groupesActifs = groups.filter((g) => g.status === "active").length
  const totalApprenants = groups.reduce((sum, g) => sum + g.memberCount, 0)
  const progressionMoyenne =
    groups.length > 0
      ? Math.round(groups.reduce((sum, g) => sum + g.progressAverage, 0) / groups.length)
      : 0

  const totalGroupes = groups.length
  const pending = groups.filter((g) => g.status === "pending").length

  const groupeTrend = filterActive
    ? "Filtré"
    : `${totalGroupes} groupe${totalGroupes > 1 ? "s" : ""} au total`

  const apprenantTrend = filterActive
    ? "Filtré"
    : groupesActifs > 0
      ? `${groupesActifs} groupe${groupesActifs > 1 ? "s" : ""} actif${groupesActifs > 1 ? "s" : ""}`
      : "Aucun groupe actif"

  const progressionTrend = filterActive
    ? "Filtré"
    : pending > 0
      ? `${pending} en attente`
      : progressionMoyenne >= 80
        ? "Bonne progression"
        : "En cours"

  const apprenantsKPIData = [
    {
      id: "groupes",
      label: "Groupes actifs",
      sublabel: "En formation actuellement",
      value: groupesActifs.toString(),
      trend: groupeTrend,
    },
    {
      id: "apprenants",
      label: "Total apprenants",
      sublabel: "Inscrits (groupes affichés)",
      value: totalApprenants.toString(),
      trend: apprenantTrend,
    },
    {
      id: "progression",
      label: "Progression moyenne",
      sublabel: "Tous groupes affichés",
      value: `${progressionMoyenne}%`,
      trend: progressionTrend,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {apprenantsKPIData.map((kpi) => (
        <AdminGlassKpiCard
          key={kpi.id}
          label={kpi.label}
          sublabel={kpi.sublabel}
          value={kpi.value}
          trend={kpi.trend}
          className="-mt-8"
        />
      ))}
    </div>
  )
}
