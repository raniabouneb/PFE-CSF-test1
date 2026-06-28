"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Award, Calendar, FileText, History, Mail, Star, User, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  createMemberNote,
  fetchMemberAttendanceHistory,
  fetchMemberProfile,
  patchMemberCertifications,
  patchMemberProgress,
  type CertificationStatus,
  type MemberProfileDto,
  type NoteType,
  type ProgressStatus,
} from "@/lib/admin/apprenants-api"

interface StudentProfileModalProps {
  studentId: string
  onClose: () => void
  onChanged: () => void
}

export default function StudentProfileModal({ studentId, onClose, onChanged }: StudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "cv" | "historique" | "presences" | "notes">("profil")
  const [profile, setProfile] = useState<MemberProfileDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteType, setNoteType] = useState<NoteType>("info")
  const [noteContent, setNoteContent] = useState("")
  const [certTitle, setCertTitle] = useState("")
  const [certScore, setCertScore] = useState("")
  const [certStatus, setCertStatus] = useState<CertificationStatus>("pending")
  const [progressDraft, setProgressDraft] = useState<
    Record<
      string,
      {
        progressPercent: number
        status: ProgressStatus
        currentFlag: boolean
        locked: boolean
        openedByAdmin: boolean
        completedByAdmin: boolean
      }
    >
  >({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchMemberProfile(studentId)
        if (cancelled) return
        setProfile(data)
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Impossible de charger le profil apprenant.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [studentId])

  useEffect(() => {
    if (!profile) return
    const next: Record<
      string,
      {
        progressPercent: number
        status: ProgressStatus
        currentFlag: boolean
        locked: boolean
        openedByAdmin: boolean
        completedByAdmin: boolean
      }
    > = {}
    for (const item of profile.progress) {
      next[item.targetRef] = {
        progressPercent: item.progressPercent,
        status: item.status,
        currentFlag: item.currentFlag,
        locked: item.locked,
        openedByAdmin: item.openedByAdmin,
        completedByAdmin: item.completedByAdmin,
      }
    }
    setProgressDraft(next)
  }, [profile])

  const { data: attendanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["member-attendance-history", studentId],
    queryFn: () => fetchMemberAttendanceHistory(studentId),
    enabled: activeTab === "presences",
  })

  const cv = useMemo(() => (profile?.learnerCv ?? {}) as Record<string, unknown>, [profile])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getNoteTypeColor = (type: NoteType) => {
    switch (type) {
      case "success":
        return "bg-[#4caf50]/15 text-[#2e7d32] border-[#4caf50]/30"
      case "warning":
        return "bg-[#ff9800]/15 text-[#e65100] border-[#ff9800]/30"
      case "info":
        return "bg-[#2196f3]/15 text-[#1565c0] border-[#2196f3]/30"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getHistoryTypeIcon = (type: "formation" | "evaluation" | "presence" | "points" | "note") => {
    switch (type) {
      case "formation":
        return <FileText className="h-4 w-4 text-[#2196f3]" />
      case "evaluation":
        return <Star className="h-4 w-4 text-[#ff9800]" />
      case "presence":
        return <Calendar className="h-4 w-4 text-[#4caf50]" />
      case "points":
        return <Award className="h-4 w-4 text-[#9c27b0]" />
      default:
        return <History className="h-4 w-4 text-[#6b7280]" />
    }
  }

  const saveNote = async () => {
    if (!noteContent.trim()) return
    try {
      await createMemberNote(studentId, { noteType, content: noteContent.trim() })
      setNoteContent("")
      toast.success("Note ajoutée.")
      const data = await fetchMemberProfile(studentId)
      setProfile(data)
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ajout de note impossible.")
    }
  }

  const saveProgress = async () => {
    if (!profile) return
    try {
      await patchMemberProgress(
        studentId,
        profile.progress.map((item) => ({
          targetRef: item.targetRef,
          accessKind: item.accessKind,
          title: item.title,
          progressPercent: progressDraft[item.targetRef]?.progressPercent ?? item.progressPercent,
          status: progressDraft[item.targetRef]?.status ?? item.status,
          currentFlag: progressDraft[item.targetRef]?.currentFlag ?? item.currentFlag,
          locked: progressDraft[item.targetRef]?.locked ?? item.locked,
          openedByAdmin: progressDraft[item.targetRef]?.openedByAdmin ?? item.openedByAdmin,
          completedByAdmin: progressDraft[item.targetRef]?.completedByAdmin ?? item.completedByAdmin,
          progressMode: item.progressMode,
          minutesCompleted: item.minutesCompleted,
          minutesTotal: item.minutesTotal,
        })),
      )
      toast.success("Progression mise à jour.")
      const data = await fetchMemberProfile(studentId)
      setProfile(data)
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mise à jour de la progression impossible.")
    }
  }

  const addCertification = async () => {
    if (!certTitle.trim()) return
    try {
      await patchMemberCertifications(studentId, [
        {
          title: certTitle.trim(),
          scopeRef: null,
          scorePercent: certScore ? Number(certScore) : null,
          status: certStatus,
          issuer: "CSF",
        },
      ])
      setCertTitle("")
      setCertScore("")
      setCertStatus("pending")
      toast.success("Certification enregistrée.")
      const data = await fetchMemberProfile(studentId)
      setProfile(data)
      onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement certification impossible.")
    }
  }

  if (loading || !profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-xl bg-white px-6 py-5 text-sm text-neutral-600 shadow-xl">Chargement du profil…</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb] bg-gradient-to-r from-[#1a3d5d] to-[#2c5282] text-white">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-white/25">
              <AvatarFallback className="bg-[#0d9488]/90 text-white font-semibold">
                {getInitials(profile.member.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{profile.member.fullName}</h2>
              <p className="text-white/80 text-sm">{profile.group.formationLabel} • {profile.group.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-[#e5e7eb] bg-[#f8fafc]">
          <button
            onClick={() => setActiveTab("profil")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "profil"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab("cv")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "cv"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            CV & Compétences
          </button>
          <button
            onClick={() => setActiveTab("historique")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "historique"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Historique
          </button>
          <button
            onClick={() => setActiveTab("presences")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "presences"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Présences
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "notes"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Notes ({profile.notes.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "profil" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1a2a3a]">Informations Personnelles</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-[#6b7280]" />
                      <span className="text-sm">{profile.member.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-[#6b7280]" />
                      <span className="text-sm">
                        Groupe créé le {profile.group.startDate ? new Date(profile.group.startDate).toLocaleDateString('fr-FR') : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-[#6b7280]" />
                      <span className="text-sm">Statut membre : {profile.member.status}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1a2a3a]">Statistiques</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border border-[#e5e7eb] rounded-lg">
                      <div className="text-2xl font-bold text-[#008080]">{profile.member.pointsTotal}</div>
                      <div className="text-sm text-[#6b7280]">Points collectés</div>
                    </div>
                    <div className="text-center p-4 border border-[#e5e7eb] rounded-lg">
                      <div className="text-2xl font-bold text-[#1a3d5d]">{profile.member.attendanceRate}%</div>
                      <div className="text-sm text-[#6b7280]">Taux de présence</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1a2a3a] mb-4">Progression dans la Formation</h3>
                <div className="border border-[#e5e7eb] rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#6b7280]">Progression globale</span>
                    <span className="text-sm font-semibold text-[#1a2a3a]">{profile.member.progressAverage}%</span>
                  </div>
                  <div className="h-2 bg-[#e5e7eb] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#008080] rounded-full transition-all"
                      style={{ width: `${profile.member.progressAverage}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-[#6b7280]">Accès accordés : {profile.accesses.length}</div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold text-[#1a2a3a]">Accès accordés</h3>
                <div className="space-y-3">
                  {profile.accesses.map((access) => (
                    <div key={access.id} className="rounded-lg border border-[#e5e7eb] p-4">
                      <p className="font-medium text-[#1a2a3a]">{access.label}</p>
                      <p className="text-xs text-[#6b7280]">{access.accessKind}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "cv" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#1a2a3a]">CV & Compétences</h3>

              <div className="space-y-5">
                <div>
                  <h4 className="font-medium text-[#1a2a3a] mb-2">Résumé des compétences</h4>
                  <div className="rounded-lg border border-[#e5e7eb] p-4 text-sm text-[#6b7280]">
                    {String(cv.skillsSummary ?? "Aucun résumé renseigné.")}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-[#1a2a3a] mb-3">Formations</h4>
                  <div className="space-y-3">
                    {((cv.formations as Array<{ id?: string; title?: string; period?: string; status?: string }> | undefined) ?? []).map((edu, index) => (
                      <div key={index} className="p-3 border border-[#e5e7eb] rounded-lg">
                        <p className="text-sm font-medium text-[#1a2a3a]">{edu.title ?? "Formation"}</p>
                        <p className="text-xs text-[#6b7280]">{edu.period ?? ""} {edu.status ? `• ${edu.status}` : ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-[#1a2a3a] mb-3">Projets</h4>
                  <div className="space-y-3">
                    {((cv.projects as Array<{ id?: string; title?: string; description?: string }> | undefined) ?? []).map((project, index) => (
                      <div key={index} className="p-3 border border-[#e5e7eb] rounded-lg">
                        <p className="text-sm font-medium text-[#1a2a3a]">{project.title ?? "Projet"}</p>
                        <p className="text-xs text-[#6b7280]">{project.description ?? ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "historique" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#1a2a3a]">Historique des Actions</h3>
              
              <div className="space-y-3">
                {profile.history.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 p-4 border border-[#e5e7eb] rounded-lg">
                    <div className="mt-0.5">
                      {getHistoryTypeIcon(entry.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-[#1a2a3a]">{entry.action}</h5>
                        <span className="text-xs text-[#6b7280]">
                          {new Date(entry.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-[#6b7280] mt-1">{entry.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "presences" && (
            <div>
              <div className="mb-4 rounded-lg bg-blue-50 p-3 text-center">
                <span className="text-2xl font-bold text-blue-800">{attendanceHistory?.attendanceRate ?? 0}%</span>
                <p className="text-xs text-blue-600">Taux de présence global</p>
              </div>
              {historyLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
              ) : attendanceHistory?.items.length === 0 ? (
                <p className="text-center text-sm text-gray-500">Aucune séance enregistrée.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-500">
                      <th className="pb-2 text-left">Séance</th>
                      <th className="pb-2 text-left">Date</th>
                      <th className="pb-2 text-left">Module</th>
                      <th className="pb-2 text-left">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory?.items.map((item) => (
                      <tr key={item.sessionId} className="border-b last:border-0">
                        <td className="py-2 font-medium">{item.sessionTitle}</td>
                        <td className="py-2 text-gray-600">
                          {new Date(item.scheduledAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-2 text-gray-600">{item.targetLabel ?? "—"}</td>
                        <td className="py-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              item.status === "present"
                                ? "bg-green-100 text-green-700"
                                : item.status === "absent"
                                  ? "bg-red-100 text-red-700"
                                  : item.status === "excused"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {item.status === "present"
                              ? "✓ Présent"
                              : item.status === "absent"
                                ? "✗ Absent"
                                : item.status === "excused"
                                  ? "~ Excusé"
                                  : "⏳ En attente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#1a2a3a]">Notes, progression et certifications</h3>
              </div>

              <div className="rounded-lg border border-[#e5e7eb] p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto]">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as NoteType)}
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Attention</option>
                    <option value="success">Positif</option>
                  </select>
                  <Input value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Ajouter une observation..." />
                  <Button size="sm" onClick={() => void saveNote()}>Ajouter la note</Button>
                </div>
              </div>

              <div className="space-y-4">
                {profile.notes.map((note) => (
                  <div key={note.id} className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getNoteTypeColor(note.noteType)}`}>
                          {note.noteType === "success" ? "Positif" : note.noteType === "warning" ? "Attention" : "Info"}
                        </span>
                        <span className="text-sm font-medium text-[#1a2a3a]">{note.authorName}</span>
                      </div>
                      <span className="text-xs text-[#6b7280]">
                        {new Date(note.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-[#6b7280]">{note.content}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-[#e5e7eb] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-medium text-[#1a2a3a]">Progression modules</h4>
                  <Button size="sm" onClick={() => void saveProgress()}>Enregistrer</Button>
                </div>
                <div className="space-y-3">
                  {profile.progress.map((item) => (
                    <div key={item.id} className="space-y-3 rounded-lg border border-[#e5e7eb] p-3">
                      <div>
                        <p className="font-medium text-[#1a2a3a]">{item.title}</p>
                        <p className="text-xs text-[#6b7280]">
                          {item.targetRef}
                          {item.progressMode === "hours"
                            ? ` • ${Math.round((item.minutesCompleted ?? 0) / 60)}h / ${Math.round(((item.minutesTotal ?? 0) || 0) / 60)}h`
                            : ""}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[120px_160px_1fr]">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          disabled={item.progressMode === "hours"}
                          value={String(progressDraft[item.targetRef]?.progressPercent ?? item.progressPercent)}
                          onChange={(e) =>
                            setProgressDraft((prev) => ({
                              ...prev,
                              [item.targetRef]: {
                                progressPercent: Number(e.target.value) || 0,
                                status: prev[item.targetRef]?.status ?? item.status,
                                currentFlag: prev[item.targetRef]?.currentFlag ?? item.currentFlag,
                                locked: prev[item.targetRef]?.locked ?? item.locked,
                                openedByAdmin: prev[item.targetRef]?.openedByAdmin ?? item.openedByAdmin,
                                completedByAdmin: prev[item.targetRef]?.completedByAdmin ?? item.completedByAdmin,
                              },
                            }))
                          }
                        />
                        <select
                          value={progressDraft[item.targetRef]?.status ?? item.status}
                          onChange={(e) =>
                            setProgressDraft((prev) => ({
                              ...prev,
                              [item.targetRef]: {
                                progressPercent: prev[item.targetRef]?.progressPercent ?? item.progressPercent,
                                status: e.target.value as ProgressStatus,
                                currentFlag: prev[item.targetRef]?.currentFlag ?? item.currentFlag,
                                locked: prev[item.targetRef]?.locked ?? item.locked,
                                openedByAdmin: prev[item.targetRef]?.openedByAdmin ?? item.openedByAdmin,
                                completedByAdmin: prev[item.targetRef]?.completedByAdmin ?? item.completedByAdmin,
                              },
                            }))
                          }
                          className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                        >
                          <option value="not_started">Non démarré</option>
                          <option value="in_progress">En cours</option>
                          <option value="completed">Terminé</option>
                        </select>
                        <div className="flex flex-wrap gap-4 text-sm text-[#1a2a3a]">
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={progressDraft[item.targetRef]?.currentFlag ?? item.currentFlag}
                              onCheckedChange={(checked) =>
                                setProgressDraft((prev) => {
                                  const next = { ...prev }
                                  if (checked === true) {
                                    for (const progressItem of profile.progress) {
                                      next[progressItem.targetRef] = {
                                        progressPercent: next[progressItem.targetRef]?.progressPercent ?? progressItem.progressPercent,
                                        status: next[progressItem.targetRef]?.status ?? progressItem.status,
                                        currentFlag: progressItem.targetRef === item.targetRef,
                                        locked:
                                          progressItem.targetRef === item.targetRef
                                            ? false
                                            : next[progressItem.targetRef]?.locked ?? progressItem.locked,
                                        openedByAdmin:
                                          progressItem.targetRef === item.targetRef
                                            ? true
                                            : next[progressItem.targetRef]?.openedByAdmin ?? progressItem.openedByAdmin,
                                        completedByAdmin:
                                          next[progressItem.targetRef]?.completedByAdmin ?? progressItem.completedByAdmin,
                                      }
                                    }
                                    return next
                                  }
                                  next[item.targetRef] = {
                                    progressPercent: next[item.targetRef]?.progressPercent ?? item.progressPercent,
                                    status: next[item.targetRef]?.status ?? item.status,
                                    currentFlag: false,
                                    locked: next[item.targetRef]?.locked ?? item.locked,
                                    openedByAdmin: next[item.targetRef]?.openedByAdmin ?? item.openedByAdmin,
                                    completedByAdmin: next[item.targetRef]?.completedByAdmin ?? item.completedByAdmin,
                                  }
                                  return next
                                })
                              }
                            />
                            Actuel
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={!(progressDraft[item.targetRef]?.locked ?? item.locked)}
                              onCheckedChange={(checked) =>
                                setProgressDraft((prev) => ({
                                  ...prev,
                                  [item.targetRef]: {
                                    progressPercent: prev[item.targetRef]?.progressPercent ?? item.progressPercent,
                                    status: prev[item.targetRef]?.status ?? item.status,
                                    currentFlag: prev[item.targetRef]?.currentFlag ?? item.currentFlag,
                                    locked: checked !== true,
                                    openedByAdmin: checked === true,
                                    completedByAdmin: prev[item.targetRef]?.completedByAdmin ?? item.completedByAdmin,
                                  },
                                }))
                              }
                            />
                            Ouvert
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={progressDraft[item.targetRef]?.completedByAdmin ?? item.completedByAdmin}
                              onCheckedChange={(checked) =>
                                setProgressDraft((prev) => ({
                                  ...prev,
                                  [item.targetRef]: {
                                    progressPercent: checked === true ? 100 : prev[item.targetRef]?.progressPercent ?? item.progressPercent,
                                    status: checked === true ? "completed" : prev[item.targetRef]?.status ?? item.status,
                                    currentFlag: prev[item.targetRef]?.currentFlag ?? item.currentFlag,
                                    locked: prev[item.targetRef]?.locked ?? item.locked,
                                    openedByAdmin: true,
                                    completedByAdmin: checked === true,
                                  },
                                }))
                              }
                            />
                            Terminé par admin
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#e5e7eb] p-4">
                <h4 className="mb-4 font-medium text-[#1a2a3a]">Certifications</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_180px_auto]">
                  <Input value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="Titre certification" />
                  <Input type="number" min={0} max={100} value={certScore} onChange={(e) => setCertScore(e.target.value)} placeholder="Score" />
                  <select
                    value={certStatus}
                    onChange={(e) => setCertStatus(e.target.value as CertificationStatus)}
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                  >
                    <option value="pending">En validation</option>
                    <option value="passed">Réussi</option>
                    <option value="failed">Échoué</option>
                  </select>
                  <Button onClick={() => void addCertification()}>Ajouter</Button>
                </div>
                <div className="mt-4 space-y-3">
                  {profile.certifications.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] p-3">
                      <div>
                        <p className="font-medium text-[#1a2a3a]">{item.title}</p>
                        <p className="text-xs text-[#6b7280]">
                          {item.status} {item.scorePercent != null ? `• ${item.scorePercent}%` : ""}
                        </p>
                      </div>
                      <Award className="h-4 w-4 text-[#1a3d5d]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-[#e5e7eb] bg-[#f8fafc]">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}