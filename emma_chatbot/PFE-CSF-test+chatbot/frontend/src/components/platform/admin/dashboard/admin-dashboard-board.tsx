"use client"

import { useQuery } from "@tanstack/react-query"
import { AdminDashboardKpis } from "@/components/platform/admin/dashboard/admin-dashboard-kpis"
import { AdminInscriptionsEvolution } from "@/components/platform/admin/dashboard/admin-inscriptions-evolution"
import { AdminRecentActivities } from "@/components/platform/admin/dashboard/admin-recent-activities"
import { AdminTopFormationsSegments } from "@/components/platform/admin/dashboard/admin-top-formations-segments"
import type { AdminDashboardStats } from "@/lib/admin/dashboard-mock-data"

export function AdminDashboardBoard() {
  const { data: stats } = useQuery<AdminDashboardStats | null>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () =>
      fetch("/api/admin/backend/dashboard/stats").then((r) => (r.ok ? r.json() : null)),
    refetchInterval: 30_000,
    staleTime: 25_000,
  })

  return (
    <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="sr-only">Tableau de bord administration</h1>
      </div>

      <div className="space-y-10">
        <AdminDashboardKpis data={stats?.kpis} />
        <AdminTopFormationsSegments
          topVisited={stats?.topVisited}
          topEnrolled={stats?.topEnrolled}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <AdminInscriptionsEvolution data={stats?.inscriptionEvolution} />
          </div>
          <div className="lg:col-span-4">
            <AdminRecentActivities variant="sidebar" data={stats?.recentActivities} />
          </div>
        </div>
      </div>
    </main>
  )
}
