import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/current-user"
import { isStaffRole } from "@/lib/auth/roles"
import { Navbar } from "@/components/layout/website/navbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/authentification/connexion?redirect=/dashboard")
  }
  if (isStaffRole(user.role)) {
    redirect("/admin")
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f4f6]">
      {/* Une seule barre : transparente sur le hero bleu, blanche une fois le hero dépassé (comme le reste du site). */}
      <Navbar variant="hero" />
      {children}
    </div>
  )
}
