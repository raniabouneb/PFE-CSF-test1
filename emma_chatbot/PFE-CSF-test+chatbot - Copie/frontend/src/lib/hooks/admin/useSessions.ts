import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminGet, adminPost, adminPatch, adminDelete } from "@/lib/api-client"
import type {
  SessionWithGroups,
  SessionDetail,
  SessionCreateBody,
  SessionPatchBody,
} from "@/types/admin"

type SessionFilters = {
  date_from?: string
  date_to?: string
  groupe_id?: string
}

function buildSessionQs(filters?: SessionFilters): string {
  if (!filters) return ""
  const qs = new URLSearchParams()
  if (filters.date_from) qs.set("date_from", filters.date_from)
  if (filters.date_to) qs.set("date_to", filters.date_to)
  if (filters.groupe_id) qs.set("groupe_id", filters.groupe_id)
  const s = qs.toString()
  return s ? `?${s}` : ""
}

export function useSessions(filters?: SessionFilters) {
  return useQuery({
    queryKey: ["sessions", filters] as const,
    queryFn: () =>
      adminGet<SessionWithGroups[]>(`sessions/${buildSessionQs(filters)}`),
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["sessions", id] as const,
    queryFn: () => adminGet<SessionDetail>(`sessions/${id}`),
    enabled: !!id,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SessionCreateBody) =>
      adminPost<SessionWithGroups>("sessions/", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sessions"] })
      void qc.invalidateQueries({ queryKey: ["planning"] })
    },
  })
}

export function useUpdateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SessionPatchBody }) =>
      adminPatch<SessionWithGroups>(`sessions/${id}`, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ["sessions"] })
      void qc.invalidateQueries({ queryKey: ["sessions", id] })
      void qc.invalidateQueries({ queryKey: ["planning"] })
    },
  })
}

export function useAddGroupeToSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      groupeId,
    }: {
      sessionId: string
      groupeId: string
    }) =>
      adminPost<SessionWithGroups>(`sessions/${sessionId}/groups`, {
        groupe_id: groupeId,
      }),
    onSuccess: (_data, { sessionId }) => {
      void qc.invalidateQueries({ queryKey: ["sessions", sessionId] })
      void qc.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}

export function useRemoveGroupeFromSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      groupeId,
    }: {
      sessionId: string
      groupeId: string
    }) => adminDelete(`sessions/${sessionId}/groups/${groupeId}`),
    onSuccess: (_data, { sessionId }) => {
      void qc.invalidateQueries({ queryKey: ["sessions", sessionId] })
      void qc.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}
