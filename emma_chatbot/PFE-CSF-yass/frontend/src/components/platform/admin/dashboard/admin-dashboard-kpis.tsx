import { AdminGlassKpiCard } from "@/components/platform/admin/dashboard/admin-glass-kpi-card"
import { KPI_DEFINITIONS_MAIN } from "@/lib/admin/dashboard-mock-data"

export function AdminDashboardKpis() {
  return (
    <section aria-labelledby="admin-kpis-heading">
      
      
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPI_DEFINITIONS_MAIN.map((k) => (
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
