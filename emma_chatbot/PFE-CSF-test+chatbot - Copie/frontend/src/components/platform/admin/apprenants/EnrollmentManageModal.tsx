"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  createEnrollment,
  deleteEnrollment,
  fetchEnrolledMembersForTarget,
  type EnrolledMemberForTarget,
} from "@/lib/admin/apprenants-api"
import { cn } from "@/lib/utils"

export type EnrollmentTarget = {
  enrollmentKind: "reconversion_pack" | "reconversion_module" | "ponctuelle_module"
  targetRef: string
  targetLabel: string
}

type Props = {
  target: EnrollmentTarget
  onClose: () => void
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0] || "?").slice(0, 2).toUpperCase()
}

function kindBadge(kind: string) {
  const isPack = kind === "reconversion_pack"
  const isReconv = kind.startsWith("reconversion")
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isPack
          ? "bg-violet-200 text-violet-900"
          : isReconv
            ? "bg-violet-100 text-violet-800"
            : "bg-sky-100 text-sky-800",
      )}
    >
      {isPack ? "Pack" : isReconv ? "Reconversion" : "Ponctuelle"}
    </span>
  )
}

export default function EnrollmentManageModal({ target, onClose }: Props) {
  const qc = useQueryClient()
  const [addEmail, setAddEmail] = useState("")

  const {
    data: members = [],
    isLoading,
    isError,
    error,
  } = useQuery<EnrolledMemberForTarget[]>({
    queryKey: ["enrolled-members-for-target", target.enrollmentKind, target.targetRef],
    queryFn: () => fetchEnrolledMembersForTarget(target.enrollmentKind, target.targetRef),
  })

  const invalidate = () => {
    void qc.invalidateQueries({
      queryKey: ["enrolled-members-for-target", target.enrollmentKind, target.targetRef],
    })
    void qc.invalidateQueries({ queryKey: ["enrollments"] })
    void qc.invalidateQueries({ queryKey: ["active-enrollments"] })
    void qc.invalidateQueries({ queryKey: ["module-sessions"] })
  }

  const addMut = useMutation({
    mutationFn: (email: string) =>
      createEnrollment({
        email: email.trim(),
        enrollmentKind: target.enrollmentKind,
        targetRef: target.targetRef,
        targetLabel: target.targetLabel,
      }),
    onSuccess: () => {
      toast.success("Apprenant inscrit.")
      setAddEmail("")
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message || "Ajout impossible."),
  })

  const removeMut = useMutation({
    mutationFn: (enrollmentId: string) => deleteEnrollment(enrollmentId),
    onSuccess: () => {
      toast.success("Inscription retirée.")
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message || "Retrait impossible."),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enrollment-manage-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <header className="shrink-0 border-b border-neutral-200 bg-gradient-to-r from-[#006d6d] to-[#008080] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="enrollment-manage-title" className="text-lg font-semibold">
                Gérer les inscriptions
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {kindBadge(target.enrollmentKind)}
                <p className="truncate text-sm text-white/90">{target.targetLabel}</p>
              </div>
              <p className="mt-1 text-xs text-white/75">
                {members.length} apprenant{members.length !== 1 ? "s" : ""} inscrit
                {members.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-white hover:bg-white/10 hover:text-white"
              onClick={onClose}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="grid flex-1 gap-1 text-sm">
              <span className="text-neutral-600">Ajouter un apprenant (e-mail)</span>
              <input
                type="email"
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-[#008080] focus:ring-2"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="apprenant@exemple.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && addEmail.trim()) {
                    e.preventDefault()
                    addMut.mutate(addEmail.trim())
                  }
                }}
              />
            </label>
            <Button
              type="button"
              className="gap-1 bg-[#008080] text-white hover:bg-[#006d6d]"
              disabled={addMut.isPending || !addEmail.trim()}
              onClick={() => {
                if (!addEmail.trim()) {
                  toast.error("Saisissez un e-mail.")
                  return
                }
                addMut.mutate(addEmail.trim())
              }}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100" />
              ))}
            </div>
          ) : isError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error instanceof Error ? error.message : "Chargement impossible."}
            </p>
          ) : members.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">
              Aucun apprenant inscrit. Ajoutez le premier ci-dessus.
            </p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.enrollmentId}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700">
                    {initials(m.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-neutral-900">{m.fullName}</p>
                    <p className="truncate text-sm text-neutral-600">{m.email}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-700">
                    {m.attendanceRate}%
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={removeMut.isPending}
                    onClick={() => removeMut.mutate(m.enrollmentId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-neutral-200 bg-neutral-50 px-5 py-3">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Fermer
          </Button>
        </footer>
      </div>
    </div>
  )
}
