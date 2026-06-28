"use client"

import { useLayoutEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { prefetchLearnerPlatformQueries } from "@/lib/hooks/learner/use-learner-platform"

/** Précharge les données apprenant dès qu’une session existe (avant le 1er paint du dashboard). */
export function LearnerPlatformWarmup({ userId }: { userId?: string | null }) {
  const qc = useQueryClient()

  useLayoutEffect(() => {
    if (!userId) return
    void prefetchLearnerPlatformQueries(qc)
  }, [userId, qc])

  return null
}
