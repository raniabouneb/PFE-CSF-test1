import { useQuery } from "@tanstack/react-query"
import { learnerGet } from "@/lib/api-client"
import type { ModuleProgression, PackModuleProgression } from "@/types/learner"

export function useProgression(enrollmentId: string) {
  return useQuery({
    queryKey: ["progression", enrollmentId] as const,
    queryFn: () =>
      learnerGet<ModuleProgression[]>(
        `formations/${encodeURIComponent(enrollmentId)}/progression`,
      ),
    enabled: !!enrollmentId,
  })
}

export function usePackProgression(enrollmentId: string) {
  return useQuery({
    queryKey: ["pack-progression", enrollmentId] as const,
    queryFn: () =>
      learnerGet<PackModuleProgression[]>(
        `formations/${encodeURIComponent(enrollmentId)}/pack-progression`,
      ),
    enabled: !!enrollmentId,
  })
}
