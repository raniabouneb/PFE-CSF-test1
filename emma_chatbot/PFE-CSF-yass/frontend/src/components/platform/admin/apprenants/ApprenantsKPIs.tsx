"use client"

import { AdminGlassKpiCard } from "@/components/platform/admin/dashboard/admin-glass-kpi-card"
import type { ApprenantGroup } from "@/lib/admin/apprenants-groups-mock"

interface ApprenantsKPIsProps {
  groups: ApprenantGroup[]
  filterActive: boolean
}

export default function ApprenantsKPIs({ groups, filterActive }: ApprenantsKPIsProps) {
  const groupesActifs = groups.filter((g) => g.statut === "active").length
  const totalApprenants = groups.reduce((sum, g) => sum + g.nombreApprenants, 0)
  const progressionMoyenne =
    groups.length > 0
      ? Math.round(groups.reduce((sum, g) => sum + g.progressionMoyenne, 0) / groups.length)
      : 0

  const apprenantsKPIData = [
    {
      id: "groupes",
      label: "Groupes actifs",
      sublabel: "En formation actuellement",
      value: groupesActifs.toString(),
      trend: filterActive ? "Filtré" : "+2 ce mois",
    },
    {
      id: "apprenants",
      label: "Total apprenants",
      sublabel: "Inscrits (groupes affichés)",
      value: totalApprenants.toString(),
      trend: filterActive ? "Filtré" : "+15 ce mois",
    },
    {
      id: "progression",
      label: "Progression moyenne",
      sublabel: "Tous groupes affichés",
      value: `${progressionMoyenne}%`,
      trend: filterActive ? "Filtré" : "+5% ce mois",
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
