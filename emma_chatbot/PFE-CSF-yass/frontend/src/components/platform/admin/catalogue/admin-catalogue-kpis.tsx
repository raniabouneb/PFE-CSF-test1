import { AdminGlassKpiCard } from "@/components/platform/admin/dashboard/admin-glass-kpi-card"
import { CATALOGUE_KPI_DEFINITIONS } from "@/lib/admin/catalogue-mock-data"

type Props = {
  moduleCount: number
  supportsPdfCount: number
  totalHeures: number
}

function formatHeures(n: number): string {
  return `${n.toLocaleString("fr-FR")} h`
}

export function AdminCatalogueKpis({ moduleCount, supportsPdfCount, totalHeures }: Props) {
  const moyenneH = moduleCount > 0 ? Math.round(totalHeures / moduleCount) : 0
  const k0 = CATALOGUE_KPI_DEFINITIONS[0]!
  const k1 = CATALOGUE_KPI_DEFINITIONS[1]!
  const k2 = CATALOGUE_KPI_DEFINITIONS[2]!

  const items = [
    {
      ...k0,
      value: String(moduleCount),
      trend:
        moduleCount >= 56
          ? `${moduleCount} modules référencés`
          : `${moduleCount} module${moduleCount > 1 ? "s" : ""}`,
    },
    {
      ...k1,
      value: String(supportsPdfCount),
      trend: `${supportsPdfCount} fichier${supportsPdfCount > 1 ? "s" : ""} listé${supportsPdfCount > 1 ? "s" : ""}`,
    },
    {
      ...k2,
      value: formatHeures(totalHeures),
      trend: moduleCount ? `Moy. ${moyenneH} h / module` : k2.trend,
    },
  ]

  return (
    <section aria-labelledby="catalogue-kpis-heading">
      <h2 id="catalogue-kpis-heading" className="sr-only">
        Indicateurs catalogue
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((k) => (
          <AdminGlassKpiCard
            key={k.id}
            label={k.label}
            sublabel={k.sublabel}
            value={k.value}
            trend={k.trend}
          />
        ))}
      </div>
    </section>
  )
}
