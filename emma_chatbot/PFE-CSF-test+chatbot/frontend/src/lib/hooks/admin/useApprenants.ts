import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminGet, adminPost, adminDelete } from "@/lib/api-client"
import type { Apprenant, GroupMemberCreateBody } from "@/types/admin"

type MemberMutationResponse = { member: Apprenant }

export function useApprenants(groupeId?: string) {
  return useQuery({
    queryKey: ["apprenants", groupeId] as const,
    queryFn: async (): Promise<Apprenant[]> => {
      if (groupeId) {
        const detail = await adminGet<{ data: { members: Apprenant[] } }>(
          `apprenants/groups/${groupeId}`,
        )
        return detail.data.members
      }
      const resp = await adminGet<{ items: { members?: Apprenant[] }[] }>(
        "apprenants/groups",
      )
      return resp.items.flatMap((g) => g.members ?? [])
    },
    enabled: groupeId !== "",
  })
}

export function useAddApprenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      groupeId,
      body,
    }: {
      groupeId: string
      body: GroupMemberCreateBody
    }) =>
      adminPost<MemberMutationResponse>(
        `apprenants/groups/${groupeId}/members`,
        body,
      ).then((r) => r.member),
    onSuccess: (_data, { groupeId }) => {
      void qc.invalidateQueries({ queryKey: ["apprenants", groupeId] })
      void qc.invalidateQueries({ queryKey: ["groupes", groupeId] })
      void qc.invalidateQueries({ queryKey: ["groupes"] })
    },
  })
}

export function useRemoveApprenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      groupeId,
      memberId,
    }: {
      groupeId: string
      memberId: string
    }) => adminDelete(`apprenants/groups/${groupeId}/members/${memberId}`),
    onSuccess: (_data, { groupeId }) => {
      void qc.invalidateQueries({ queryKey: ["apprenants", groupeId] })
      void qc.invalidateQueries({ queryKey: ["groupes", groupeId] })
      void qc.invalidateQueries({ queryKey: ["groupes"] })
    },
  })
}
