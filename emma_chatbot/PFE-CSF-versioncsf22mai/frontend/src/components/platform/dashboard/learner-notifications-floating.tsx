"use client"

import { usePathname } from "next/navigation"
import { NotificationBell } from "@/components/platform/dashboard/NotificationBell"

/** Ancienne page module avec `DashboardHero` (cloche déjà dans le hero). */
function usesLegacyDashboardHero(pathname: string) {
  return /\/dashboard\/formations\/[^/]+\/modules\//.test(pathname)
}

export function LearnerNotificationsFloating() {
  const pathname = usePathname() ?? ""
  if (usesLegacyDashboardHero(pathname)) return null

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-50 sm:right-4 sm:top-4">
      <div className="pointer-events-auto">
        <NotificationBell variant="dashboard" />
      </div>
    </div>
  )
}
