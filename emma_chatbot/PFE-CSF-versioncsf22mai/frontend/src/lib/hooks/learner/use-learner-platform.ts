"use client"

import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { learnerGet } from "@/lib/api-client"
import type {
  LearnerCertificationsPayload,
  LearnerDashboardPayload,
  LearnerFormationsPayload,
} from "@/lib/server/learner-api"

/** Cache mémoire 90s — navigation dashboard quasi instantanée entre onglets. */
export const LEARNER_STALE_MS = 90_000

export const learnerPlatformKeys = {
  /** v3 : présence en heures (sans « en attente ») */
  dashboard: ["learner-platform", "dashboard", "v3"] as const,
  formations: ["learner-platform", "formations", "v3"] as const,
  certifications: ["learner-platform", "certifications"] as const,
}

export function useLearnerDashboard() {
  return useQuery({
    queryKey: learnerPlatformKeys.dashboard,
    queryFn: () => learnerGet<LearnerDashboardPayload>("dashboard"),
    staleTime: LEARNER_STALE_MS,
    gcTime: 5 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  })
}

export function useLearnerFormationsPayload() {
  return useQuery({
    queryKey: learnerPlatformKeys.formations,
    queryFn: () => learnerGet<LearnerFormationsPayload>("formations"),
    staleTime: LEARNER_STALE_MS,
    gcTime: 5 * 60_000,
  })
}

export function useLearnerCertificationsPayload() {
  return useQuery({
    queryKey: learnerPlatformKeys.certifications,
    queryFn: () => learnerGet<LearnerCertificationsPayload>("certifications"),
    staleTime: LEARNER_STALE_MS,
    gcTime: 5 * 60_000,
  })
}

export function prefetchLearnerPlatformQueries(qc: QueryClient) {
  return Promise.all([
    qc.prefetchQuery({
      queryKey: learnerPlatformKeys.dashboard,
      queryFn: () => learnerGet<LearnerDashboardPayload>("dashboard"),
      staleTime: LEARNER_STALE_MS,
    }),
    qc.prefetchQuery({
      queryKey: learnerPlatformKeys.formations,
      queryFn: () => learnerGet<LearnerFormationsPayload>("formations"),
      staleTime: LEARNER_STALE_MS,
    }),
    qc.prefetchQuery({
      queryKey: learnerPlatformKeys.certifications,
      queryFn: () => learnerGet<LearnerCertificationsPayload>("certifications"),
      staleTime: LEARNER_STALE_MS,
    }),
  ])
}
