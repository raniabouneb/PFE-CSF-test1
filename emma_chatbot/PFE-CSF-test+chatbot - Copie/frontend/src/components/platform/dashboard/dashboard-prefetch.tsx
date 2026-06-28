"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { prefetchLearnerPlatformQueries } from "@/lib/hooks/learner/use-learner-platform"

/** Précharge dashboard / formations / certifications dès l’entrée dans l’espace apprenant. */
export function DashboardPrefetch() {
  const qc = useQueryClient()

  useEffect(() => {
    void prefetchLearnerPlatformQueries(qc)
  }, [qc])

  return null
}
