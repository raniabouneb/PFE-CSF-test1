"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Calendar, Key, Loader2, Pencil, Trash2, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGroupe, useDeleteGroupe } from "@/lib/hooks"
import { adminGet } from "@/lib/api-client"
import {
  createGroupAccess,
  createGroupMember,
  createGroupSession,
  deleteGroupAccess,
  deleteGroupMember,
  deleteGroupSession,
  fetchApprenantFilters,
  patchGroupSession,
  patchSessionAttendance,
  type AccessKind,
  type ApprenantFiltersPayload,
  type AttendanceStatus,
  type GroupDetailDto,
} from "@/lib/admin/apprenants-api"
import { fetchCatalogueModules } from "@/lib/admin/catalogue-api"

interface GroupDetailsModalProps {
  groupId: string
  onClose: () => void
  onStudentSelect: (studentId: string) => void
  onChanged: () => void
}

type AccessOption = { kind: AccessKind; targetRef: string; label: string }

export default function GroupDetailsModal({ groupId, onClose, onStudentSelect, onChanged }: GroupDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"members" | "access" | "sessions" | "attendance">("members")
  const [filtersPayload, setFiltersPayload] = useState<ApprenantFiltersPayload | null>(null)
  const [memberEmail, setMemberEmail] = useState("")
  const [memberFirstName, setMemberFirstName] = useState("")
  const [memberLastName, setMemberLastName] = useState("")
  const [sessionTitle, setSessionTitle] = useState("")
  const [sessionDate, setSessionDate] = useState("")
  const [sessionTime, setSessionTime] = useState("")
  const [sessionDuration, setSessionDuration] = useState("120")
  const [sessionStatus, setSessionStatus] = useState<"planned" | "completed" | "cancelled">("planned")
  const [sessionTargetRef, setSessionTargetRef] = useState("")
  const [accessKind, setAccessKind] = useState<AccessKind>("reconversion_pack")
  const [accessTargetRef, setAccessTargetRef] = useState("")
  const [selectedPonctuelleAccessRefs, setSelectedPonctuelleAccessRefs] = useState<string[]>([])
  const [accessOptions, setAccessOptions] = useState<AccessOption[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, AttendanceStatus>>({})
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editDuration, setEditDuration] = useState("120")
  const [editStatus, setEditStatus] = useState<"planned" | "completed" | "cancelled">("planned")

  const qc = useQueryClient()
  const { data: detail = null, isLoading: loading, refetch: refetchDetail } = useGroupe(groupId)
  const deleteGroupe = useDeleteGroupe()

  useEffect(() => {
    fetchApprenantFilters()
      .then(setFiltersPayload)
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!detail) return
    if (!selectedSessionId && detail.sessions[0]?.id) {
      setSelectedSessionId(detail.sessions[0].id)
    }
  }, [detail, selectedSessionId])

  useEffect(() => {
    const session = detail?.sessions.find((item) => item.id === selectedSessionId)
    if (!session) return
    const next: Record<string, AttendanceStatus> = {}
    for (const item of session.attendance) {
      next[item.memberId] = item.status
    }
    setAttendanceDraft(next)
  }, [detail, selectedSessionId])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!detail) return
      const group = detail.group
      const opts: AccessOption[] = []
      if (group.format === "reconversion") {
        if (group.reconversionTopicSlug && group.reconversionTopicLabel) {
          opts.push({
            kind: "reconversion_topic",
            targetRef: group.reconversionTopicSlug,
            label: `Parcours — ${group.reconversionTopicLabel}`,
          })
        }
        for (const pack of (filtersPayload?.reconversionPacks ?? []).filter((p) => p.topicSlug === group.reconversionTopicSlug)) {
          opts.push({
            kind: "reconversion_pack",
            targetRef: pack.id,
            label: `Pack — ${pack.label}`,
          })
        }
        const modules = await fetchCatalogueModules({
          format: "reconversion",
          segment: group.reconversionTopicSlug ?? undefined,
          reconversionPackId: group.reconversionPackId ?? undefined,
          page: 1,
          pageSize: 200,
        })
        for (const item of modules.items) {
          opts.push({
            kind: "reconversion_module",
            targetRef: item.id,
            label: `Module — ${item.titre}`,
          })
        }
      } else if (group.format === "ponctuelle") {
        const modules = await fetchCatalogueModules({
          format: "ponctuelle",
          page: 1,
          pageSize: 500,
        })
        for (const item of modules.items) {
          opts.push({
            kind: "ponctuelle_module",
            targetRef: item.id,
            label: `Module — ${item.segmentLabel ? `${item.segmentLabel} • ` : ""}${item.titre}`,
          })
        }
      }
      if (!mounted) return
      setAccessOptions(opts)
      if (!accessTargetRef && opts[0]) {
        setAccessKind(opts[0].kind)
        setAccessTargetRef(opts[0].targetRef)
      }
      if (!sessionTargetRef && opts.find((item) => item.kind.endsWith("_module"))) {
        setSessionTargetRef(opts.find((item) => item.kind.endsWith("_module"))?.targetRef ?? "")
      }
    })().catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [detail, filtersPayload, accessTargetRef, sessionTargetRef])

  const selectedAttendanceSession = useMemo(
    () => detail?.sessions.find((item) => item.id === selectedSessionId) ?? null,
    [detail, selectedSessionId],
  )

  const visibleAccessOptions = accessOptions.filter((option) => option.kind === accessKind)
  const sessionTargetOptions = accessOptions.filter((option) => option.kind.endsWith("_module"))

  const groupTitle = detail?.group.name ?? `Groupe ${groupId}`
  const groupSubtitle = detail?.group ? `${detail.group.formationLabel} • ${detail.group.memberCount} apprenants` : ""

  const refresh = async () => {
    await refetchDetail()
    onChanged()
  }

  const addMember = async () => {
    try {
      await createGroupMember(groupId, {
        email: memberEmail,
        firstName: memberFirstName || null,
        lastName: memberLastName || null,
      })
      setMemberEmail("")
      setMemberFirstName("")
      setMemberLastName("")
      toast.success("Apprenant ajouté au groupe.")
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ajout impossible.")
    }
  }

  const addAccess = async () => {
    try {
      if (detail?.group.format === "ponctuelle" && accessKind === "ponctuelle_module") {
        const refs = selectedPonctuelleAccessRefs.length ? selectedPonctuelleAccessRefs : [accessTargetRef]
        await Promise.all(refs.map((targetRef) => createGroupAccess(groupId, { accessKind, targetRef })))
      } else {
        await createGroupAccess(groupId, { accessKind, targetRef: accessTargetRef })
      }
      setSelectedPonctuelleAccessRefs([])
      toast.success("Accès ajouté.")
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ajout de l'accès impossible.")
    }
  }

  const addSession = async () => {
    if (!sessionTitle.trim() || !sessionDate || !sessionTime) return
    try {
      await createGroupSession(groupId, {
        title: sessionTitle,
        targetRef: sessionTargetRef || null,
        targetKind: sessionTargetRef.includes("reconversion") ? "reconversion_module" : sessionTargetRef ? "ponctuelle_module" : null,
        targetLabel: accessOptions.find((item) => item.targetRef === sessionTargetRef)?.label ?? null,
        scheduledAt: new Date(`${sessionDate}T${sessionTime}`).toISOString(),
        durationMinutes: Number(sessionDuration) || 120,
        status: sessionStatus,
      })
      setSessionTitle("")
      setSessionDate("")
      setSessionTime("")
      setSessionDuration("120")
      setSessionStatus("planned")
      setSessionTargetRef("")
      toast.success("Séance créée.")
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Création de séance impossible.")
    }
  }

  const saveAttendance = async () => {
    if (!selectedAttendanceSession) return
    try {
      await patchSessionAttendance(
        selectedAttendanceSession.id,
        Object.entries(attendanceDraft).map(([memberId, status]) => ({ memberId, status })),
      )
      toast.success("Présences mises à jour.")
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mise à jour des présences impossible.")
    }
  }

  const startEditSession = (s: GroupDetailDto["sessions"][number]) => {
    setEditingSessionId(s.id)
    setEditTitle(s.title)
    const dt = new Date(s.scheduledAt)
    setEditDate(dt.toISOString().slice(0, 10))
    setEditTime(dt.toTimeString().slice(0, 5))
    setEditDuration(String(s.durationMinutes))
    setEditStatus(s.status as "planned" | "completed" | "cancelled")
  }

  const saveEditSession = async () => {
    if (!editingSessionId || editingSessionId.startsWith("planning-")) return
    try {
      await patchGroupSession(editingSessionId, {
        title: editTitle,
        scheduledAt: new Date(`${editDate}T${editTime}`).toISOString(),
        durationMinutes: Number(editDuration) || 120,
        status: editStatus,
      })
      setEditingSessionId(null)
      toast.success("Séance modifiée.")
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Modification impossible.")
    }
  }

  const removeSession = async (sessionId: string) => {
    if (sessionId.startsWith("planning-")) {
      toast.error("Cette séance provient du planning, modifiez-la depuis le calendrier.")
      return
    }
    if (!window.confirm("Supprimer cette séance ?")) return
    try {
      await deleteGroupSession(sessionId)
      toast.success("Séance supprimée.")
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible.")
    }
  }

  const removeGroup = async () => {
    if (!window.confirm(`Supprimer le groupe « ${groupTitle} » ?`)) return
    try {
      await deleteGroupe.mutateAsync(groupId)
      toast.success("Groupe supprimé.")
      onChanged()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression du groupe impossible.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb] bg-gradient-to-r from-[#1a3d5d] to-[#2c5282] text-white">
          <div>
            <h2 className="text-xl font-semibold">{groupTitle}</h2>
            {groupSubtitle ? <p className="text-sm text-white/80">{groupSubtitle}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={() => void removeGroup()}
              disabled={deleteGroupe.isPending}
            >
              {deleteGroupe.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {deleteGroupe.isPending ? "Suppression…" : "Supprimer"}
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-[#e5e7eb] bg-[#f8fafc]">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "members"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Membres
          </button>
          <button
            onClick={() => setActiveTab("access")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "access"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Accès
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "sessions"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "attendance"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Présences
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading || !detail ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              <span className="text-sm text-neutral-600">Chargement du groupe…</span>
            </div>
          ) : null}

          {activeTab === "members" && detail ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#e5e7eb] p-4">
                <h3 className="mb-4 text-lg font-semibold text-[#1a2a3a]">Ajouter un apprenant</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <Input placeholder="Email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
                  <Input placeholder="Prénom" value={memberFirstName} onChange={(e) => setMemberFirstName(e.target.value)} />
                  <Input placeholder="Nom" value={memberLastName} onChange={(e) => setMemberLastName(e.target.value)} />
                  <Button onClick={() => void addMember()} disabled={!memberEmail.trim()}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {detail.members.map((student) => (
                  <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#1a2a3a]">{student.fullName}</p>
                      <p className="text-sm text-[#6b7280]">{student.email}</p>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        {student.attendanceRate}% présence • {student.progressAverage}% progression • {student.pointsTotal} points
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onStudentSelect(student.id)}>
                        Profil & suivi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() =>
                          void deleteGroupMember(groupId, student.id)
                            .then(() => {
                              toast.success("Apprenant supprimé du groupe.")
                              return refresh()
                            })
                            .catch((e) => toast.error(e instanceof Error ? e.message : "Suppression impossible."))
                        }
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "access" && detail ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#e5e7eb] p-4">
                <h3 className="mb-4 text-lg font-semibold text-[#1a2a3a]">Ajouter un accès pédagogique</h3>
                <p className="mb-4 text-sm text-[#6b7280]">
                  Choisissez clairement ce que le groupe doit suivre. En reconversion, vous pouvez ouvrir un pack ou un module.
                  En ponctuelle, vous pouvez ajouter plusieurs modules d&apos;un seul coup.
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <select
                    value={accessKind}
                    onChange={(e) => {
                      setAccessKind(e.target.value as AccessKind)
                      const next = accessOptions.find((item) => item.kind === (e.target.value as AccessKind))
                      setAccessTargetRef(next?.targetRef ?? "")
                    }}
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                  >
                    {[...new Set(accessOptions.map((item) => item.kind))].map((kind) => (
                      <option key={kind} value={kind}>
                        {kind === "reconversion_topic"
                          ? "Parcours reconversion"
                          : kind === "reconversion_pack"
                            ? "Pack reconversion"
                            : kind === "reconversion_module"
                              ? "Module reconversion"
                              : kind === "ponctuelle_formation"
                                ? "Formation ponctuelle"
                                : "Module ponctuel"}
                      </option>
                    ))}
                  </select>
                  <select
                    value={accessTargetRef}
                    onChange={(e) => setAccessTargetRef(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm md:col-span-2"
                  >
                    {visibleAccessOptions.map((option) => (
                      <option key={`${option.kind}-${option.targetRef}`} value={option.targetRef}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {detail.group.format === "ponctuelle" && accessKind === "ponctuelle_module" ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#0D3570]">
                      Sélection multiple de modules ponctuels
                    </p>
                    <div className="grid max-h-[200px] grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
                      {visibleAccessOptions.map((option) => (
                        <label key={option.targetRef} className="flex items-start gap-2 rounded-md bg-white px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedPonctuelleAccessRefs.includes(option.targetRef)}
                            onChange={(e) =>
                              setSelectedPonctuelleAccessRefs((prev) =>
                                e.target.checked
                                  ? [...prev, option.targetRef]
                                  : prev.filter((item) => item !== option.targetRef)
                              )
                            }
                            className="mt-1"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                <Button className="mt-3" onClick={() => void addAccess()} disabled={!accessTargetRef}>
                  <Key className="mr-2 h-4 w-4" />
                  Ajouter l&apos;accès
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[#1a2a3a]">Accès actuels</h3>
                <div className="space-y-3">
                  {detail.accesses.map((access) => (
                    <div key={access.id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] p-3">
                      <div>
                        <p className="font-medium text-[#1a2a3a]">{access.label}</p>
                        <p className="text-xs text-[#6b7280]">
                          {access.kindLabel}
                          {access.formationLabel ? ` • ${access.formationLabel}` : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() =>
                          void deleteGroupAccess(groupId, access.id)
                            .then(() => {
                              toast.success("Accès supprimé.")
                              return refresh()
                            })
                            .catch((e) => toast.error(e instanceof Error ? e.message : "Suppression impossible."))
                        }
                      >
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "sessions" && detail ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#e5e7eb] p-4">
                <h3 className="mb-4 text-lg font-semibold text-[#1a2a3a]">Planifier une séance</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input placeholder="Titre" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} />
                  <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
                  <Input type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <select
                    value={sessionTargetRef}
                    onChange={(e) => setSessionTargetRef(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                  >
                    <option value="">Séance générale du groupe</option>
                    {sessionTargetOptions.map((option) => (
                      <option key={`${option.kind}-${option.targetRef}`} value={option.targetRef}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Input type="number" min={0} value={sessionDuration} onChange={(e) => setSessionDuration(e.target.value)} />
                  <select
                    value={sessionStatus}
                    onChange={(e) => setSessionStatus(e.target.value as "planned" | "completed" | "cancelled")}
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                  >
                    <option value="planned">Planifiée</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
                <Button className="mt-3" onClick={() => void addSession()} disabled={!sessionTitle || !sessionDate || !sessionTime}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Ajouter la séance
                </Button>
              </div>

              <div className="space-y-3">
                {detail.sessions.map((session) => (
                  <div key={session.id} className="rounded-lg border border-[#e5e7eb] p-4">
                    {editingSessionId === session.id ? (
                      <div className="space-y-3">
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titre" />
                        <div className="grid grid-cols-3 gap-2">
                          <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                          <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                          <Input type="number" min={0} value={editDuration} onChange={(e) => setEditDuration(e.target.value)} placeholder="Durée" />
                        </div>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}
                          className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                        >
                          <option value="planned">Planifiée</option>
                          <option value="completed">Terminée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => void saveEditSession()}>Enregistrer</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingSessionId(null)}>Annuler</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-[#1a2a3a]">{session.title}</h4>
                          <p className="text-sm text-[#6b7280]">
                            {new Date(session.scheduledAt).toLocaleString("fr-FR")} • {session.durationMinutes} min
                          </p>
                          {session.targetLabel ? (
                            <p className="text-xs text-[#0D3570]">Cible pédagogique : {session.targetLabel}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="whitespace-nowrap rounded-full bg-[#0D3570]/10 px-2.5 py-1 text-xs font-medium text-[#0D3570]">
                            {session.attendanceSummary.present}/{session.attendanceSummary.total} présents
                          </span>
                          <button
                            type="button"
                            className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                            onClick={() => startEditSession(session)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                            onClick={() => void removeSession(session.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "attendance" && detail ? (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">Séance</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                >
                  {detail.sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title} — {new Date(session.scheduledAt).toLocaleString("fr-FR")}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAttendanceSession ? (
                <div className="space-y-3">
                  {detail.members.map((member) => (
                    <div key={member.id} className="grid grid-cols-1 gap-3 rounded-lg border border-[#e5e7eb] p-4 md:grid-cols-[1fr_220px]">
                      <div>
                        <p className="font-medium text-[#1a2a3a]">{member.fullName}</p>
                        <p className="text-sm text-[#6b7280]">{member.email}</p>
                      </div>
                      <select
                        value={attendanceDraft[member.id] ?? "pending"}
                        onChange={(e) =>
                          setAttendanceDraft((prev) => ({
                            ...prev,
                            [member.id]: e.target.value as AttendanceStatus,
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                      >
                        <option value="pending">En attente</option>
                        <option value="present">Présent</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excusé</option>
                      </select>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button onClick={() => void saveAttendance()}>Enregistrer les présences</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">Aucune séance disponible.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-[#e5e7eb] bg-[#f8fafc]">
          <div className="text-sm text-[#6b7280]">
            Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}