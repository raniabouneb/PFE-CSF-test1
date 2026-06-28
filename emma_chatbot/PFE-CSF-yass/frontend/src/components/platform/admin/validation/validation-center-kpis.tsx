"use client"

import { AdminGlassKpiCard } from "@/components/platform/admin/dashboard/admin-glass-kpi-card"
import { VALIDATION_CENTER_MONTHLY_STATS } from "@/lib/admin/validation-queue-mock"

type Props = {
  pendingTotal: number
  pendingCertificates: number
  pendingRecommendations: number
}

export function ValidationCenterKpis({
  pendingTotal,
  pendingCertificates,
  pendingRecommendations,
}: Props) {
  const { certificationsDeliveredLastMonth, recommendationLettersDeliveredLastMonth, monthLabel } =
    VALIDATION_CENTER_MONTHLY_STATS

  const items = [
    {
      id: "pending",
      label: "Documents à valider",
      sublabel: "File d’attente actuelle",
      value: String(pendingTotal),
      trend:
        pendingTotal === 0
          ? "Aucun dossier en attente"
          : `${pendingCertificates} certificat${pendingCertificates > 1 ? "s" : ""}, ${pendingRecommendations} lettre${pendingRecommendations > 1 ? "s" : ""} de recommandation`,
    },
    {
      id: "certs-month",
      label: "Certifications délivrées",
      sublabel: `Mois dernier (${monthLabel})`,
      value: String(certificationsDeliveredLastMonth),
      trend: "Validées et obtenues par les apprenants",
    },
    {
      id: "letters-month",
      label: "Lettres de recommandation",
      sublabel: `Traitées le mois dernier (${monthLabel})`,
      value: String(recommendationLettersDeliveredLastMonth),
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
