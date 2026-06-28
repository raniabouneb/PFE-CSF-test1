import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"
import { isStaffRole, isAssistantOnly } from "@/lib/auth/roles"
import { Navbar } from "@/components/layout/website/navbar"
import { AdminViewerProvider } from "@/components/platform/admin/admin-viewer-context"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/authentification/connexion?redirect=/admin")
  }
  if (!isStaffRole(user.role)) {
    redirect("/dashboard")
  }

  const isAssistant = isAssistantOnly(user.role)

  return (
    <AdminViewerProvider isAssistant={isAssistant}>
      <div className="flex min-h-screen flex-col bg-[#f3f4f6]">
        {/* Navbar avec variant hero pour l'admin */}
        <Navbar variant="hero" />
        {children}
      </div>
    </AdminViewerProvider>
  )
}