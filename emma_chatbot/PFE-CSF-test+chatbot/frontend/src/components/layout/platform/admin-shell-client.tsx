"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import AdminHero from "./admin-hero"
import { useAuthUser } from "@/components/platform/auth/auth-user-context"
import { adminSubTabFromPathname } from "@/lib/admin/admin-platform-nav"

/** Coque admin persistante (hero + onglets) — le contenu des pages change sans rechargement serveur. */
export function AdminShellClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const user = useAuthUser()
  const activeSubTab = adminSubTabFromPathname(pathname)

  const greetingName =
    user?.name?.trim()?.split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    null

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <AdminHero
        activeSubTab={activeSubTab}
        greetingName={greetingName}
        userRole={user?.role}
      />
      {children}
    </div>
  )
}
