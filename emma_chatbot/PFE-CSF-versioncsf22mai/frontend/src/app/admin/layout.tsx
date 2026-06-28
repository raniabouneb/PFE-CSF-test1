import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"
import { isStaffRole } from "@/lib/auth/roles"
import { Navbar } from "@/components/layout/website/navbar"
import { AdminShellClient } from "@/components/layout/platform/admin-shell-client"
import { AdminViewerProviderClient } from "@/components/platform/admin/admin-viewer-provider-client"
import { AdminProviders } from "@/components/providers/admin-providers"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user?.id || !user.email) {
    redirect("/authentification/connexion?redirect=/admin")
  }
  if (!isStaffRole(user.role)) {
    redirect("/dashboard")
  }

  return (
    <AdminProviders>
      <AdminViewerProviderClient role={user.role}>
        <div className="flex min-h-screen flex-col bg-[#f3f4f6]">
          <Navbar variant="hero" />
          <AdminShellClient>{children}</AdminShellClient>
        </div>
      </AdminViewerProviderClient>
    </AdminProviders>
  )
}
