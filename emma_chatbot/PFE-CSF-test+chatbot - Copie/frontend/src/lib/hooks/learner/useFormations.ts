import { useQuery } from "@tanstack/react-query"
import { learnerGet } from "@/lib/api-client"
import type { Formation, ModuleDetail, SessionPlanifiee } from "@/types/learner"

export function useFormations() {
  return useQuery({
    queryKey: ["formations"] as const,
    queryFn: () => learnerGet<Formation[]>("formations/"),
  })
}

export function useModuleDetail(enrollmentId: string, moduleId: string) {
  return useQuery({
    queryKey: ["module-detail", enrollmentId, moduleId] as const,
    queryFn: () =>
      learnerGet<ModuleDetail>(
        `formations/${encodeURIComponent(enrollmentId)}/modules/${encodeURIComponent(moduleId)}`,
      ),
    enabled: !!enrollmentId && !!moduleId,
  })
}

export function usePlanning() {
  return useQuery({
    queryKey: ["planning"] as const,
    queryFn: () => learnerGet<SessionPlanifiee[]>("formations/planning"),
  })
}
