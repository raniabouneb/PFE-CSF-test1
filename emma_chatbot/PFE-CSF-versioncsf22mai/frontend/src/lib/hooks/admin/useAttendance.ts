import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminGet, adminPost } from "@/lib/api-client"
import type { AttendanceRecord } from "@/types/admin"

export function useAttendance(sessionId: string) {
  return useQuery({
    queryKey: ["attendance", sessionId] as const,
    queryFn: () =>
      adminGet<AttendanceRecord[]>(`sessions/${sessionId}/attendance`),
    enabled: !!sessionId,
  })
}

type SaveAttendanceVars = {
  sessionId: string
  records: { apprenant_id: string; present: boolean }[]
}

export function useSaveAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, records }: SaveAttendanceVars) =>
      adminPost<AttendanceRecord[]>(
        `sessions/${sessionId}/attendance`,
        records,
      ),

    onMutate: async ({ sessionId, records }) => {
      await qc.cancelQueries({ queryKey: ["attendance", sessionId] })

      const previous = qc.getQueryData<AttendanceRecord[]>([
        "attendance",
        sessionId,
      ])

      if (previous) {
        const presenceMap = new Map(
          records.map((r) => [r.apprenant_id, r.present]),
        )

        qc.setQueryData<AttendanceRecord[]>(
          ["attendance", sessionId],
          previous.map((entry) => {
            const next = presenceMap.get(entry.apprenant_id)
            return next !== undefined ? { ...entry, present: next } : entry
          }),
        )
      }

      return { previous, sessionId }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(
          ["attendance", context.sessionId],
          context.previous,
        )
      }
    },

    onSettled: (_data, _err, { sessionId }) => {
      void qc.invalidateQueries({ queryKey: ["attendance", sessionId] })
      void qc.invalidateQueries({ queryKey: ["progression"] })
      void qc.invalidateQueries({ queryKey: ["pack-progression"] })
      void qc.invalidateQueries({ queryKey: ["sessions", sessionId] })
    },
  })
}
