import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"
import { isStaffRole } from "@/lib/auth/roles"
import PlatformSidebar from "@/components/layout/platform/platform-sidebar"
import MobileSidebarWrapper from "@/components/layout/platform/mobile-sidebar-wrapper"
import { LearnerNotificationsFloating } from "@/components/platform/dashboard/learner-notifications-floating"
import { DashboardPrefetch } from "@/components/platform/dashboard/dashboard-prefetch"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user?.id || !user.email) {
    redirect("/authentification/connexion?redirect=/dashboard")
  }
  if (isStaffRole(user.role)) {
    redirect("/admin")
  }

  return (
    <MobileSidebarWrapper sidebar={<PlatformSidebar />}>
      <div className="min-h-screen bg-[#E9EDF7]">
        <DashboardPrefetch />
        <LearnerNotificationsFloating />
        {children}
      </div>
    </MobileSidebarWrapper>
  )
}
