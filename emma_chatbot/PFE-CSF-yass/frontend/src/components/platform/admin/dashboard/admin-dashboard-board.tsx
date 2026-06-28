"use client"

import { AdminDashboardKpis } from "@/components/platform/admin/dashboard/admin-dashboard-kpis"
import { AdminInscriptionsEvolution } from "@/components/platform/admin/dashboard/admin-inscriptions-evolution"
import { AdminRecentActivities } from "@/components/platform/admin/dashboard/admin-recent-activities"
import { AdminTopFormationsSegments } from "@/components/platform/admin/dashboard/admin-top-formations-segments"
import { useAdminViewer } from "@/components/platform/admin/admin-viewer-context"

export function AdminDashboardBoard() {
  const { isAssistant } = useAdminViewer()

  return (
    <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="sr-only">Tableau de bord administration</h1>
        {isAssistant ? (
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-2 text-sm text-amber-950">
            <span className="font-semibold">Vue assistante.</span> Certaines actions sensibles pourront être
            limitées côté API ; le journal reste consultable pour la coordination avec l’administrateur.
          </p>
        ) : null}
      </div>

      <div className="space-y-10">
        <AdminDashboardKpis />
        <AdminTopFormationsSegments />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <AdminInscriptionsEvolution />
          </div>
          <div className="lg:col-span-4">
            <AdminRecentActivities variant="sidebar" />
          </div>
        </div>
      </div>
    </main>
  )
}
