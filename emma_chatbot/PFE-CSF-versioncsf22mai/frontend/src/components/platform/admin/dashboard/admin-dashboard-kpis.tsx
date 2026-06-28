import { AdminGlassKpiCard } from "@/components/platform/admin/dashboard/admin-glass-kpi-card"

type KpiItem = { id: string; label: string; sublabel: string; value: string; trend?: string }

const LOADING_PLACEHOLDERS: KpiItem[] = [
  { id: "1", label: "Chargement…", sublabel: "", value: "—" },
  { id: "2", label: "Chargement…", sublabel: "", value: "—" },
  { id: "3", label: "Chargement…", sublabel: "", value: "—" },
  { id: "4", label: "Chargement…", sublabel: "", value: "—" },
]

export function AdminDashboardKpis({ data }: { data?: KpiItem[] | null }) {
  const items = data ?? LOADING_PLACEHOLDERS
  return (
    <section aria-labelledby="admin-kpis-heading">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
