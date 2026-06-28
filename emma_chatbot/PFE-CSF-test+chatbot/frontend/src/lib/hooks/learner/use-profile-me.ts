"use client"

import { useQuery } from "@tanstack/react-query"
import type { ProfileUser } from "@/lib/auth/learner-profile-types"

export const profileMeKey = ["profile-me"] as const

export function useProfileMe() {
  return useQuery({
    queryKey: profileMeKey,
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      if (!res.ok) throw new Error("Profil indisponible")
      return (await res.json()) as ProfileUser
    },
    staleTime: 60_000,
  })
}
