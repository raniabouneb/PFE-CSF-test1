import { AdminFormationSegmentBars } from "@/components/platform/admin/dashboard/admin-formation-segment-bars"
import { TOP_ENROLLED, TOP_VISITED } from "@/lib/admin/dashboard-mock-data"

export function AdminTopFormationsSegments() {
  return (
    <section aria-labelledby="admin-segments-heading">
      <h2 id="admin-segments-heading" className="mb-4 text-lg font-semibold text-[#0f172a]">
        Formations les plus consultées et inscrites
      </h2>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminFormationSegmentBars
          title="Les plus consultées (site web)"
          subtitle="Indice et volumes sur le mois — démo."
          items={TOP_VISITED}
          metricSuffix="vues"
        />
        <AdminFormationSegmentBars
          title="Les plus inscrites (apprenants)"
          subtitle="Indice et inscriptions sur le mois — démo."
          items={TOP_ENROLLED}
          metricSuffix="inscrits"
        />
      </div>
    </section>
  )
}
