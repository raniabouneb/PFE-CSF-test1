import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminGet, adminPost, adminPatch, adminDelete } from "@/lib/api-client"
import type {
  Groupe,
  GroupDetail,
  GroupCreateBody,
  GroupPatchBody,
} from "@/types/admin"

type GroupListResponse = { items: Groupe[] }
type GroupDetailResponse = { data: GroupDetail }
type GroupMutationResponse = { group: Groupe }

type GroupeFilters = {
  format?: string
  status?: string
  reconversionTopicSlug?: string
  ponctuelleFormationSlug?: string
  reconversionPackId?: string
}

function buildGroupQs(filters?: GroupeFilters): string {
  if (!filters) return ""
  const qs = new URLSearchParams()
  if (filters.format) qs.set("format", filters.format)
  if (filters.status) qs.set("status", filters.status)
  if (filters.reconversionTopicSlug) qs.set("reconversionTopicSlug", filters.reconversionTopicSlug)
  if (filters.ponctuelleFormationSlug) qs.set("ponctuelleFormationSlug", filters.ponctuelleFormationSlug)
  if (filters.reconversionPackId) qs.set("reconversionPackId", filters.reconversionPackId)
  const s = qs.toString()
  return s ? `?${s}` : ""
}

export function useGroupes(filters?: GroupeFilters) {
  return useQuery({
    queryKey: ["groupes", filters] as const,
    queryFn: () =>
      adminGet<GroupListResponse>(`apprenants/groups${buildGroupQs(filters)}`)
        .then((r) => r.items),
  })
}

export function useGroupe(id: string) {
  return useQuery({
    queryKey: ["groupes", id] as const,
    queryFn: () =>
      adminGet<GroupDetailResponse>(`apprenants/groups/${id}`)
        .then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateGroupe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: GroupCreateBody) =>
      adminPost<GroupMutationResponse>("apprenants/groups", body)
        .then((r) => r.group),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["groupes"] })
    },
  })
}

export function useUpdateGroupe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: GroupPatchBody }) =>
      adminPatch<GroupMutationResponse>(`apprenants/groups/${id}`, body)
        .then((r) => r.group),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ["groupes"] })
      void qc.invalidateQueries({ queryKey: ["groupes", id] })
    },
  })
}

export function useDeleteGroupe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      adminDelete(`apprenants/groups/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["groupes"] })
    },
  })
}
