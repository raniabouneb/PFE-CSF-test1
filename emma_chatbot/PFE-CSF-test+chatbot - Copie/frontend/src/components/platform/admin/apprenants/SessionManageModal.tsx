"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import ExcelImportModal from "@/components/platform/admin/apprenants/ExcelImportModal"
import GlobalExcelImportModal from "@/components/platform/admin/apprenants/GlobalExcelImportModal"
import {
  addMemberToModuleSession,
  deleteModuleSession,
  fetchGroupDetail,
  fetchModuleSessionMembers,
  patchSessionAttendance,
  removeMemberFromModuleSession,
  type AttendanceStatus,
  type GroupSessionDto,
  type ModuleSessionSummary,
} from "@/lib/admin/apprenants-api"
import { cn } from "@/lib/utils"

type Props = {
  session: ModuleSessionSummary
  onClose: () => void
}

type TabId = "members" | "sessions"

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  const single = parts[0] || "?"
  return single.slice(0, 2).toUpperCase()
}

function isDbGroupSession(row: GroupSessionDto): boolean {
  return /^\d+$/.test(String(row.id))
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "Présent", color: "text-emerald-700" },
  { value: "absent", label: "Absent", color: "text-red-700" },
  { value: "excused", label: "Excusé", color: "text-amber-700" },
  { value: "pending", label: "En attente", color: "text-neutral-500" },
]

function AttendancePanel({
  session,
  groupId,
  onUpdated,
}: {
  session: GroupSessionDto
  groupId: string
  onUpdated: () => void
}) {
  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(session.attendance.map((a) => [a.memberId, a.status])),
  )
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setLocalStatuses(Object.fromEntries(session.attendance.map((a) => [a.memberId, a.status])))
    setDirty(false)
  }, [session])

  const { data: members = [] } = useQuery({
    queryKey: ["module-session-members", groupId],
    queryFn: () => fetchModuleSessionMembers(groupId),
  })

  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members])

  const handleChange = (memberId: string, status: AttendanceStatus) => {
    setLocalStatuses((prev) => ({ ...prev, [memberId]: status }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const items = Object.entries(localStatuses).map(([memberId, status]) => ({
        memberId,
        status,
      }))
      await patchSessionAttendance(String(session.id), items)
      toast.success("Présences enregistrées.")
      setDirty(false)
      onUpdated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.")
    } finally {
      setSaving(false)
    }
  }

  if (session.attendance.length === 0) {
    return (
      <p className="mt-3 border-t border-neutral-100 pt-3 text-sm text-neutral-500">
        Aucun apprenant dans cette séance.
      </p>
    )
  }

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        Présences — {session.attendance.length} apprenant(s)
      </p>
      <ul className="space-y-2">
        {session.attendance.map((att) => {
          const member = memberById[att.memberId]
          const currentStatus = localStatuses[att.memberId] ?? att.status
          const opt = ATTENDANCE_OPTIONS.find((o) => o.value === currentStatus)
          return (
            <li
              key={att.memberId}
              className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-white px-3 py-2"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-900">
                {member ? initials(member.fullName) : "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {member?.fullName ?? att.memberId}
                </p>
                <p className="truncate text-xs text-neutral-500">{member?.email ?? ""}</p>
              </div>
              <select
                className={`rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm font-medium outline-none ring-blue-500 focus:ring-2 ${opt?.color ?? ""}`}
                value={currentStatus}
                onChange={(e) => handleChange(att.memberId, e.target.value as AttendanceStatus)}
              >
                {ATTENDANCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </li>
          )
        })}
      </ul>
      {dirty ? (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            className="bg-blue-700 text-white hover:bg-blue-800"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Enregistrement…" : "Enregistrer les présences"}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default function SessionManageModal({ session, onClose }: Props) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<TabId>("members")
  const [liveSession, setLiveSession] = useState(session)
  const [addEmail, setAddEmail] = useState("")
  const [excelImport, setExcelImport] = useState<{ sessionId: string; title: string } | null>(null)
  const [globalImport, setGlobalImport] = useState(false)
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)

  useEffect(() => {
    setLiveSession(session)
  }, [session])

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["module-session-members", session.groupId],
    queryFn: () => fetchModuleSessionMembers(session.groupId),
  })

  const { data: groupDetail, isLoading: groupLoading } = useQuery({
    queryKey: ["group-detail", session.groupId],
    queryFn: () => fetchGroupDetail(session.groupId),
  })

  const sessionsList = useMemo(() => groupDetail?.sessions ?? [], [groupDetail])
  const memberCountDisplay = members.length
  const sessionCountDisplay = useMemo(
    () => sessionsList.filter((s) => isDbGroupSession(s)).length,
    [sessionsList],
  )

  const addMemberMut = useMutation({
    mutationFn: (email: string) => addMemberToModuleSession(session.groupId, email),
    onSuccess: (updated) => {
      setLiveSession(updated)
      toast.success("Apprenant ajouté.")
      void qc.invalidateQueries({ queryKey: ["module-session-members", session.groupId] })
      void qc.invalidateQueries({ queryKey: ["module-sessions"] })
      void qc.invalidateQueries({ queryKey: ["active-enrollments"] })
      void qc.invalidateQueries({ queryKey: ["group-detail", session.groupId] })
      void qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] })
      setAddEmail("")
    },
    onError: (e: Error) => toast.error(e.message || "Ajout impossible."),
  })

  const removeMemberMut = useMutation({
    mutationFn: (memberId: string) => removeMemberFromModuleSession(session.groupId, memberId),
    onSuccess: () => {
      toast.success("Apprenant retiré.")
      void qc.invalidateQueries({ queryKey: ["module-session-members", session.groupId] })
      void qc.invalidateQueries({ queryKey: ["module-sessions"] })
      void qc.invalidateQueries({ queryKey: ["active-enrollments"] })
      void qc.invalidateQueries({ queryKey: ["group-detail", session.groupId] })
      void qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] })
      setLiveSession((prev) => ({
        ...prev,
        memberCount: Math.max(0, prev.memberCount - 1),
      }))
    },
    onError: (e: Error) => toast.error(e.message || "Retrait impossible."),
  })

  const deleteSessionMut = useMutation({
    mutationFn: () => deleteModuleSession(session.groupId),
    onSuccess: () => {
      toast.success("Session-module supprimée.")
      void qc.invalidateQueries({ queryKey: ["module-sessions"] })
      void qc.invalidateQueries({ queryKey: ["active-enrollments"] })
      void qc.invalidateQueries({ queryKey: ["enrollments"] })
      onClose()
    },
    onError: (e: Error) => toast.error(e.message || "Suppression impossible."),
  })

  const tabBtn = (id: TabId, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={cn(
        "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        tab === id
          ? "border-blue-500 text-blue-700"
          : "border-transparent text-neutral-600 hover:text-neutral-900",
      )}
    >
      {label}
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-manage-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-[700px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <header className="shrink-0 bg-gradient-to-r from-slate-900 to-blue-900 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="session-manage-title" className="truncate text-lg font-semibold">
                {liveSession.sessionLabel}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1">
                {liveSession.accesses.map((a) => (
                  <span
                    key={a.id}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      a.accessKind === "reconversion_module"
                        ? "bg-violet-400/30 text-violet-100"
                        : "bg-sky-400/30 text-sky-100"
                    }`}
                  >
                    {a.accessKind === "reconversion_pack"
                      ? "Pack"
                      : a.accessKind === "reconversion_module"
                        ? "Reconversion"
                        : "Ponctuelle"}{" "}
                    · {a.moduleLabel}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm text-white/85">
                Session-module · {memberCountDisplay} apprenants · {sessionCountDisplay} séances
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
          <nav className="mt-3 flex flex-wrap gap-1 border-t border-white/20 pt-3">
            {tabBtn("members", "Apprenants")}
            {tabBtn("sessions", "Séances & Présences")}
          </nav>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tab === "members" ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="grid flex-1 gap-1 text-sm">
                  <span className="text-neutral-600">E-mail</span>
                  <input
                    type="email"
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="apprenant@exemple.com"
                  />
                </label>
                <Button
                  type="button"
                  className="gap-1 bg-blue-700 text-white hover:bg-blue-800"
                  disabled={addMemberMut.isPending}
                  onClick={() => {
                    const e = addEmail.trim()
                    if (!e) {
                      toast.error("Saisissez un e-mail.")
                      return
                    }
                    addMemberMut.mutate(e)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  + Ajouter
                </Button>
              </div>

              {membersLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-500">Aucun apprenant dans cette session.</p>
              ) : (
                <ul className="space-y-2">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-900">
                        {initials(m.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-neutral-900">{m.fullName}</p>
                        <p className="truncate text-sm text-neutral-600">{m.email}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-800">
                        {m.attendanceRate}%
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        disabled={removeMemberMut.isPending}
                        onClick={() => removeMemberMut.mutate(m.id)}
                      >
                        Retirer
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === "sessions" ? (
            <div className="space-y-3">
              <div className="mb-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => setGlobalImport(true)}
                >
                  📥 Import global
                </Button>
              </div>
              {groupLoading ? (
                <div className="space-y-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
                  ))}
                </div>
              ) : sessionsList.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-500">Aucune séance planifiée.</p>
              ) : (
                <ul className="space-y-3">
                  {sessionsList.map((s) => {
                    const sum = s.attendanceSummary
                    const denom = sum.total
                    const done = sum.present + sum.excused
                    const real = isDbGroupSession(s)
                    return (
                      <li
                        key={s.id}
                        className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium text-neutral-900">{s.title}</p>
                            <p className="mt-0.5 text-sm text-neutral-600">
                              {formatSessionDate(s.scheduledAt)} · {s.durationMinutes} min
                            </p>
                            <p className="mt-1 text-sm text-neutral-700">
                              {done}/{denom} présences
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                            {sum.pending > 0 ? (
                              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                                ⚠ {sum.pending} en attente
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                                ✓ À jour
                              </span>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {real ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() =>
                                    setExpandedSessionId((prev) =>
                                      prev === String(s.id) ? null : String(s.id),
                                    )
                                  }
                                >
                                  {expandedSessionId === String(s.id) ? "▲ Masquer" : "👁 Présences"}
                                </Button>
                              ) : null}
                              {real ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => setExcelImport({ sessionId: String(s.id), title: s.title })}
                                >
                                  📥 Importer Excel
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {expandedSessionId === String(s.id) ? (
                          <AttendancePanel
                            session={s}
                            groupId={session.groupId}
                            onUpdated={() => {
                              void qc.invalidateQueries({ queryKey: ["group-detail", session.groupId] })
                              void qc.invalidateQueries({ queryKey: ["module-sessions"] })
                              void qc.invalidateQueries({
                                queryKey: ["module-session-members", session.groupId],
                              })
                            }}
                          />
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : null}

        </div>

        <footer className="shrink-0 border-t border-neutral-200 bg-neutral-50 px-5 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={deleteSessionMut.isPending}
              onClick={() => {
                const ok = window.confirm("Supprimer cette session-module ?")
                if (!ok) return
                deleteSessionMut.mutate()
              }}
            >
              {deleteSessionMut.isPending ? "Suppression…" : "Supprimer la session"}
            </Button>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </footer>
      </div>

      {excelImport ? (
        <ExcelImportModal
          sessionId={excelImport.sessionId}
          sessionTitle={excelImport.title}
          onClose={() => setExcelImport(null)}
          onSuccess={() => {
            void qc.invalidateQueries({ queryKey: ["group-detail", session.groupId] })
            void qc.invalidateQueries({ queryKey: ["module-sessions"] })
            void qc.invalidateQueries({ queryKey: ["module-session-members", session.groupId] })
            void qc.invalidateQueries({ queryKey: ["active-enrollments"] })
          }}
        />
      ) : null}

      {globalImport ? (
        <GlobalExcelImportModal
          groupId={session.groupId}
          sessionLabel={session.sessionLabel}
          onClose={() => setGlobalImport(false)}
          onSuccess={() => {
            void qc.invalidateQueries({ queryKey: ["group-detail", session.groupId] })
            void qc.invalidateQueries({ queryKey: ["module-sessions"] })
            void qc.invalidateQueries({ queryKey: ["module-session-members", session.groupId] })
            setGlobalImport(false)
          }}
        />
      ) : null}
    </div>
  )
}
