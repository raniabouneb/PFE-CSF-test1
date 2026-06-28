"use client"

import DashboardHero from "@/components/platform/dashboard/dashboard-hero"
import { useAuthUser } from "@/components/platform/auth/auth-user-context"
import { useLearnerDashboard } from "@/lib/hooks/learner/use-learner-platform"
import ModuleDetailContent from "./module-detail-content"

export default function ModuleDetailShell({
  enrollmentId,
  moduleId,
}: {
  enrollmentId: string
  moduleId: string
}) {
  const user = useAuthUser()
  const { data: dashboard } = useLearnerDashboard()

  const greetingName =
    dashboard?.greetingName ??
    user?.name?.split(/\s+/)[0] ??
    user?.email?.split("@")[0] ??
    null

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <DashboardHero activeSubTab="formations" greetingName={greetingName} />

      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        <ModuleDetailContent enrollmentId={enrollmentId} moduleId={moduleId} />
      </main>
    </div>
  )
}
