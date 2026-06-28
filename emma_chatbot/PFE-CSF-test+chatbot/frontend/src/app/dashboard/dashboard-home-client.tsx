"use client"

import DashboardWelcomeBanner from "@/components/platform/dashboard/dashboard-welcome-banner"
import DashboardProfileCard from "@/components/platform/dashboard/dashboard-profile-card"
import DashboardSessionsCardSlot from "@/components/platform/dashboard/dashboard-sessions-card-slot"
import DashboardKpiSection from "@/components/platform/dashboard/dashboard-kpi-section"
import ActiveFormationsCard from "@/components/platform/dashboard/cards/ActiveFormationsCard"
import { useAuthUser } from "@/components/platform/auth/auth-user-context"
import {
  useLearnerDashboard,
  useLearnerFormationsPayload,
} from "@/lib/hooks/learner/use-learner-platform"
import type { ModuleProgressBar } from "@/components/platform/dashboard/cards/FormationsCard"
import { resolveBarPresence } from "@/lib/dashboard/resolve-bar-presence"
import { DASHBOARD_COLUMN_GLASS_CLASS } from "@/components/platform/dashboard/formations-glass-card"
import { cn } from "@/lib/utils"

function avatarPath(photoUrl: string | null | undefined, email: string | null | undefined): string | null {
  if (photoUrl) return `/api/profile/photo?url=${encodeURIComponent(photoUrl)}`
  const safeEmail = (email ?? "").trim()
  if (!safeEmail.includes("@")) return null
  return `/api/profile/avatar?email=${encodeURIComponent(safeEmail)}`
}

export default function DashboardHomeClient() {
  const user = useAuthUser()
  const { data: dashboard, isPending, isFetching } = useLearnerDashboard()
  const { data: formations } = useLearnerFormationsPayload()

  const loading = isPending && !dashboard

  const greetingName =
    dashboard?.greetingName?.trim()?.split(/\s+/)[0] ||
    user?.name?.trim()?.split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    null

  const profileName = dashboard?.profileCard.name ?? user?.name ?? "Apprenant CSF"
  const profileEmail = dashboard?.profileCard.email ?? user?.email ?? ""
  const formationCount = dashboard?.formationsCard.count
  const certObtained = dashboard?.certificationsCard.obtained
  const certTotal = dashboard?.certificationsCard.total

  const activeFormations = dashboard?.activeFormations ?? []
  const courses = formations?.courses ?? []

  const globalPresence =
    dashboard?.profileCard.attendanceSummary ?? {
      presentHours: 0,
      absentHours: 0,
      attendancePercent: 0,
    }

  const moduleBars: ModuleProgressBar[] =
    dashboard?.formationsCard.moduleBars?.map((bar) => {
      const presence = resolveBarPresence(bar, courses)
      return {
        title: bar.title,
        percent: bar.percent,
        presenceData: presence,
      }
    }) ??
    activeFormations.map((formation) => ({
      title: formation.title,
      percent: formation.progress,
      presenceData: globalPresence,
    }))

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col gap-2 p-2 md:p-2 lg:flex-row lg:gap-4 lg:p-4",
        isFetching && dashboard && "opacity-[0.98]",
      )}
    >
      <div className={cn(DASHBOARD_COLUMN_GLASS_CLASS, "min-w-0 flex-1")}>
        <DashboardWelcomeBanner name={greetingName} />

        <section
          aria-labelledby="learner-kpis-heading"
          className={cn(loading && "animate-pulse")}
          aria-busy={loading}
        >
          <h2 id="learner-kpis-heading" className="sr-only">
            Indicateurs personnels
          </h2>
          <DashboardKpiSection
            count={formationCount}
            moduleBars={loading ? [] : moduleBars}
            certObtained={certObtained}
            certTotal={certTotal}
          />
        </section>

        <section aria-labelledby="learner-activity-heading" className={cn(loading && "animate-pulse")}>
          <h2 id="learner-activity-heading" className="sr-only">
            Formations actives
          </h2>
          <ActiveFormationsCard formations={loading ? [] : activeFormations} embedded />
        </section>
      </div>

      <aside
        className={cn(
          DASHBOARD_COLUMN_GLASS_CLASS,
          "w-full shrink-0 lg:w-[340px] xl:w-[360px]",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <DashboardProfileCard
            name={profileName}
            email={profileEmail}
            avatarSrc={avatarPath(user?.photoUrl, profileEmail)}
          />
        </div>

        <DashboardSessionsCardSlot />
      </aside>
    </div>
  )
}
