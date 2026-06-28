"use client"

import { useEffect, useState, type ReactNode } from "react"
import { AdminViewerProvider } from "@/components/platform/admin/admin-viewer-context"
import type { ProfileUser } from "@/lib/auth/learner-profile-types"

/** Droits staff chargés en arrière-plan (layout admin non bloquant). */
export function AdminViewerProviderClient({
  role,
  children,
}: {
  role: string | null | undefined
  children: ReactNode
}) {
  const [staffPermissions, setStaffPermissions] = useState<
    ProfileUser["staffPermissions"] | null
  >(null)

  useEffect(() => {
    let cancelled = false
    void fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ProfileUser | null) => {
        if (!cancelled && data?.staffPermissions) {
          setStaffPermissions(data.staffPermissions)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AdminViewerProvider role={role} staffPermissions={staffPermissions}>
      {children}
    </AdminViewerProvider>
  )
}
