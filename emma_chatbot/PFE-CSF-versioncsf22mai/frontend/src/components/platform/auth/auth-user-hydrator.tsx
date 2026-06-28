"use client"

import { useEffect } from "react"
import type { AuthUser } from "@/components/platform/auth/auth-user-context"
import type { ProfileUser } from "@/lib/auth/learner-profile-types"
import { mapMeToAuthUser } from "@/lib/auth/map-me-to-auth-user"

/**
 * Enrichit le profil complet depuis GET /auth/me (prénom, nom, téléphone, photo).
 */
export function AuthUserHydrator({
  sessionUser,
  onUser,
}: {
  sessionUser: AuthUser | null
  onUser: (user: AuthUser | null) => void
}) {
  useEffect(() => {
    if (!sessionUser?.id) {
      onUser(null)
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as ProfileUser
        if (!cancelled && data?.id) {
          onUser(mapMeToAuthUser(data, sessionUser))
        }
      } catch {
        /* garde les infos JWT */
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [sessionUser?.id, sessionUser?.email, onUser])

  return null
}
