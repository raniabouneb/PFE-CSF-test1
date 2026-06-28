import type { ReactNode } from "react"
import AdminHero from "./admin-hero"
import { getCurrentUser } from "@/lib/auth/current-user"
import type { AdminSubTabId } from "@/lib/admin/admin-platform-nav"

export default async function AdminShell({
  activeSubTab,
  children,
}: {
  activeSubTab: AdminSubTabId
  children: ReactNode
}) {
  const user = await getCurrentUser()
  const greetingName =
    user?.firstName?.trim() ||
    (user?.name?.trim() ? user.name.trim().split(/\s+/)[0] : null) ||
    null

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <AdminHero activeSubTab={activeSubTab} greetingName={greetingName} />
      {children}
    </div>
  )
}
