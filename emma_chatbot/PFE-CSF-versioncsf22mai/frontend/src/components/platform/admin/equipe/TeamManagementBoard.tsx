"use client"

import { FormEvent, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiErrorMessage } from "@/lib/api-error-message"
import {
  SECTION_LABELS,
  STAFF_SECTIONS,
  resolveStaffPermissions,
  type StaffPermissionsMap,
  type StaffSectionId,
} from "@/lib/admin/staff-permissions"
import { cn } from "@/lib/utils"

export type StaffTeamMember = {
  id: number | string
  email: string
  email_normalized: string
  role: string
  status: string
  user_id: string | null
  invited_by: string | null
  created_at: string | null
  updated_at: string | null
  userName: string | null
  permissions?: Partial<Record<string, { read: boolean; write: boolean }>>
}

type InviteRole = "assistant" | "admin"

async function fetchTeam(): Promise<StaffTeamMember[]> {
  const res = await fetch("/api/admin/staff/team", { cache: "no-store" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(apiErrorMessage(data, "Chargement impossible."))
  }
  return Array.isArray(data) ? data : []
}

function memberInitial(member: StaffTeamMember): string {
  const name = (member.userName ?? member.email ?? "?").trim()
  return name.charAt(0).toUpperCase() || "?"
}

function permissionsFromMember(member: StaffTeamMember): StaffPermissionsMap {
  return resolveStaffPermissions(member.role, member.permissions ?? undefined)
}

function permissionsToApiBody(perms: StaffPermissionsMap) {
  const permissions: Record<string, { read: boolean; write: boolean }> = {}
  for (const s of STAFF_SECTIONS) {
    permissions[s] = { read: perms[s].read, write: perms[s].write }
  }
  return { permissions }
}

function StatusBadge({ member }: { member: StaffTeamMember }) {
  if (member.role === "admin") {
    return (
      <span className="rounded-full bg-[#0D3570] px-2.5 py-0.5 text-xs font-semibold text-white">
        Administrateur
      </span>
    )
  }
  if (member.status === "pending") {
    return (
      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
        En attente
      </span>
    )
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
      Assistante active
    </span>
  )
}

function PermissionsEditor({
  perms,
  onChange,
  onSave,
  saving,
  showSave = true,
}: {
  perms: StaffPermissionsMap
  onChange: (next: StaffPermissionsMap) => void
  onSave?: () => void
  saving?: boolean
  showSave?: boolean
}) {
  const toggle = (section: StaffSectionId, field: "read" | "write") => {
    const next = { ...perms, [section]: { ...perms[section] } }
    next[section][field] = !next[section][field]
    if (field === "read" && !next[section].read) {
      next[section].write = false
    }
    if (field === "write" && next[section].write) {
      next[section].read = true
    }
    onChange(next)
  }

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3">
      <p className="mb-3 text-xs font-medium text-neutral-700">Droits par page du tableau de bord</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="pb-2 pr-4 font-medium">Page</th>
              <th className="pb-2 px-2 text-center font-medium">Lecture</th>
              <th className="pb-2 px-2 text-center font-medium">Écriture</th>
            </tr>
          </thead>
          <tbody>
            {STAFF_SECTIONS.map((section) => (
              <tr key={section} className="border-b border-neutral-100 last:border-0">
                <td className="py-2 pr-4 text-neutral-800">{SECTION_LABELS[section]}</td>
                <td className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={perms[section].read}
                    onChange={() => toggle(section, "read")}
                    className="h-4 w-4 rounded border-neutral-300"
                    aria-label={`Lecture — ${SECTION_LABELS[section]}`}
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={perms[section].write}
                    onChange={() => toggle(section, "write")}
                    disabled={!perms[section].read}
                    className="h-4 w-4 rounded border-neutral-300 disabled:opacity-40"
                    aria-label={`Écriture — ${SECTION_LABELS[section]}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showSave && onSave ? (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            className="bg-[#0D3570] hover:bg-[#0a2a5c]"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Enregistrer les droits
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function TeamManagementBoard() {
  const qc = useQueryClient()
  const [email, setEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<InviteRole>("assistant")
  const [invitePerms, setInvitePerms] = useState<StaffPermissionsMap>(() =>
    resolveStaffPermissions("assistant"),
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draftPerms, setDraftPerms] = useState<StaffPermissionsMap | null>(null)

  const { data: members = [], isLoading, isError, error } = useQuery({
    queryKey: ["staff-team"],
    queryFn: fetchTeam,
  })

  const addMutation = useMutation({
    mutationFn: async (payload: { email: string; role: InviteRole; permissions: StaffPermissionsMap }) => {
      const res = await fetch("/api/admin/staff/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: payload.email,
          role: payload.role,
          permissions: permissionsToApiBody(payload.permissions).permissions,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(apiErrorMessage(data, "Invitation impossible."))
      }
      return data
    },
    onSuccess: () => {
      toast.success("Membre ajouté à l'équipe.")
      setEmail("")
      void qc.invalidateQueries({ queryKey: ["staff-team"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const revokeMutation = useMutation({
    mutationFn: async (memberId: number | string) => {
      const res = await fetch(`/api/admin/staff/team/${encodeURIComponent(String(memberId))}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(apiErrorMessage(data, "Retrait impossible."))
      }
      return data
    },
    onSuccess: () => {
      toast.success("Membre retiré.")
      setExpandedId(null)
      void qc.invalidateQueries({ queryKey: ["staff-team"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const savePermsMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: number; permissions: StaffPermissionsMap }) => {
      const res = await fetch(`/api/admin/staff/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permissionsToApiBody(permissions)),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(apiErrorMessage(data, "Enregistrement impossible."))
      }
      return data
    },
    onSuccess: () => {
      toast.success("Droits mis à jour.")
      void qc.invalidateQueries({ queryKey: ["staff-team"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.role === b.role) return (a.email ?? "").localeCompare(b.email ?? "")
      if (a.role === "admin") return -1
      if (b.role === "admin") return 1
      return 0
    })
  }, [members])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      toast.error("Saisissez une adresse e-mail.")
      return
    }
    addMutation.mutate({ email: trimmed, role: inviteRole, permissions: invitePerms })
  }

  const openPermissions = (member: StaffTeamMember) => {
    const key = String(member.id)
    if (expandedId === key) {
      setExpandedId(null)
      setDraftPerms(null)
      return
    }
    setExpandedId(key)
    setDraftPerms(permissionsFromMember(member))
  }

  return (
    <main className="relative z-10 mx-auto max-w-[960px] px-4 pb-16 pt-6 text-[#0f172a] md:px-8 md:pb-20 lg:-mt-10 lg:px-12">
      <h1 className="mb-2 text-2xl font-semibold text-[#0f172a]">Équipe CSF</h1>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-neutral-600">
        Ajoutez des administrateurs ou des assistantes, définissez la lecture et l&apos;écriture pour chaque
        page du tableau de bord. Les assistantes ne voient pas cet onglet Équipe.
      </p>

      <form
        onSubmit={onSubmit}
        className="mb-8 space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="staff-email" className="mb-1 block text-xs font-medium text-neutral-700">
              E-mail
            </label>
            <Input
              id="staff-email"
              type="email"
              placeholder="membre@exemple.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={addMutation.isPending}
              className="bg-white"
            />
          </div>
          <div className="sm:w-48">
            <label htmlFor="staff-role" className="mb-1 block text-xs font-medium text-neutral-700">
              Rôle
            </label>
            <select
              id="staff-role"
              value={inviteRole}
              onChange={(ev) => {
                const role = ev.target.value as InviteRole
                setInviteRole(role)
                setInvitePerms(resolveStaffPermissions(role))
              }}
              className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="assistant">Assistante</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <Button
            type="submit"
            className="bg-[#0D3570] hover:bg-[#0a2a5c] sm:shrink-0"
            disabled={addMutation.isPending}
          >
            {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Ajouter
          </Button>
        </div>

        <PermissionsEditor perms={invitePerms} onChange={setInvitePerms} showSave={false} />
        <p className="text-xs text-neutral-500">
          Les cases ci-dessus s&apos;appliquent au nouveau membre. Vous pourrez les modifier après ajout.
        </p>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 py-10 text-center text-sm text-red-800">
          {(error as Error)?.message ?? "Impossible de charger l'équipe."}
        </p>
      ) : sortedMembers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 bg-white py-10 text-center text-sm text-neutral-500">
          Aucun membre pour le moment.
        </p>
      ) : (
        <ul className="space-y-3">
          {sortedMembers.map((member) => {
            const key = String(member.id)
            const isExpanded = expandedId === key
            const hasInviteRow = typeof member.id === "number"
            const canManagePerms = hasInviteRow
            const canRevoke = true

            return (
              <li
                key={key}
                className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                        member.role === "admin" ? "bg-[#0D3570]" : "bg-[#1a5a9e]",
                      )}
                    >
                      {memberInitial(member)}
                    </div>
                    <div className="min-w-0">
                      {member.userName ? (
                        <p className="truncate text-sm font-semibold text-[#0f172a]">{member.userName}</p>
                      ) : (
                        <p className="text-sm italic text-neutral-500">Compte non créé</p>
                      )}
                      <p className="truncate text-xs text-neutral-600">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusBadge member={member} />
                    {canManagePerms ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openPermissions(member)}
                      >
                        Droits
                        {isExpanded ? (
                          <ChevronUp className="ml-1 h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="ml-1 h-3.5 w-3.5" />
                        )}
                      </Button>
                    ) : null}
                    {canRevoke ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        disabled={revokeMutation.isPending}
                        onClick={() => revokeMutation.mutate(member.id)}
                      >
                        {member.status === "pending" ? "Annuler" : "Retirer"}
                      </Button>
                    ) : null}
                  </div>
                </div>

                {isExpanded && draftPerms && hasInviteRow ? (
                  <PermissionsEditor
                    perms={draftPerms}
                    onChange={setDraftPerms}
                    saving={savePermsMutation.isPending}
                    onSave={() =>
                      savePermsMutation.mutate({
                        id: member.id as number,
                        permissions: draftPerms,
                      })
                    }
                  />
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
