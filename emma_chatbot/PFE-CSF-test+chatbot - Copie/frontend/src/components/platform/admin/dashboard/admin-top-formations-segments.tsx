import { AdminFormationSegmentBars } from "@/components/platform/admin/dashboard/admin-formation-segment-bars"

type BarItem = { title: string; slug: string; score: number; visits?: number; enrollments?: number }

export function AdminTopFormationsSegments({
  topVisited,
  topEnrolled,
}: {
  topVisited?: BarItem[] | null
  topEnrolled?: BarItem[] | null
}) {
  return (
    <section aria-labelledby="admin-segments-heading">
      <h2 id="admin-segments-heading" className="mb-4 text-lg font-semibold text-[#0f172a]">
        Formations les plus consultées et inscrites
      </h2>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminFormationSegmentBars
          title="Les plus consultées (site web)"
          subtitle="Sessions visiteurs uniques par page."
          items={topVisited ?? []}
          metricSuffix="visites"
          emptyMessage="Aucune visite enregistrée pour le moment."
        />
        <AdminFormationSegmentBars
          title="Les plus inscrites (groupes)"
          subtitle="Nombre d'inscrits par groupe de formation."
          items={topEnrolled ?? []}
          metricSuffix="inscrits"
          emptyMessage="Aucune inscription pour le moment."
        />
      </div>
    </section>
  )
}
