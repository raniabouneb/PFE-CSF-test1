"use client"

import { AdminGlassKpiCard } from "@/components/platform/admin/dashboard/admin-glass-kpi-card"
import type { ValidationStats } from "@/lib/admin/validation-api"

type Props = {
  pendingTotal: number
  pendingCertificates: number
  pendingRecommendations: number
  stats: ValidationStats | null
}

export function ValidationCenterKpis({
  pendingTotal,
  pendingCertificates,
  pendingRecommendations,
  stats,
}: Props) {
  const validatedMonth = stats?.validated_this_month ?? 0
  const rejectedMonth = stats?.rejected_this_month ?? 0

  const items = [
    {
      id: "pending",
      label: "Documents à valider",
      sublabel: "File d'attente actuelle",
      value: String(pendingTotal),
      trend:
        pendingTotal === 0
          ? "Aucun dossier en attente"
          : `${pendingCertificates} certificat${pendingCertificates > 1 ? "s" : ""}, ${pendingRecommendations} lettre${pendingRecommendations > 1 ? "s" : ""} de recommandation`,
    },
    {
      id: "validated-month",
      label: "Validés ce mois",
      sublabel: "Documents validés ce mois-ci",
      value: String(validatedMonth),
      trend: "Certifications et recommandations délivrées",
    },
    {
      id: "rejected-month",
      label: "Rejetés ce mois",
      sublabel: "Documents rejetés ce mois-ci",
      value: String(rejectedMonth),
      trend:
        pendingRecommendations > 0
          ? `${pendingRecommendations} en attente dans la file`
          : "Aucune lettre en attente",
    },
  ]

  return (
    <section aria-labelledby="validation-kpis-heading">
      <h2 id="validation-kpis-heading" className="sr-only">
        Indicateurs centre de validation
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((k) => (
          <AdminGlassKpiCard
            key={k.id}
            label={k.label}
            sublabel={k.sublabel}
            value={k.value}
            trend={k.trend}
            className="mt-0"
          />
        ))}
      </div>
    </section>
  )
}
