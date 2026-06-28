"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, CalendarDays, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import SessionFormModal from "@/components/platform/admin/seances/SessionFormModal"
import SessionCard from "@/components/platform/admin/seances/SessionCard"
import AttendanceModal from "@/components/platform/admin/seances/AttendanceModal"
import {
  fetchSessions,
  createSession,
  deleteSession,
  type SessionDto,
  type SessionCreateBody,
} from "@/lib/admin/sessions-api"

export default function SeancesPage() {
  const [sessions, setSessions] = useState<SessionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [attendanceSession, setAttendanceSession] = useState<SessionDto | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchSessions()
      setSessions(data)
    } catch {
      toast.error("Erreur chargement des séances")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleCreate = async (body: SessionCreateBody) => {
    setSaving(true)
    try {
      await createSession(body)
      toast.success("Séance planifiée")
      setShowForm(false)
      await load()
    } catch {
      toast.error("Erreur création séance")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (session: SessionDto) => {
    if (!confirm(`Supprimer la séance « ${session.titre} » ?`)) return
    try {
      await deleteSession(session.id)
      toast.success("Séance supprimée")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur suppression")
    }
  }

  const planifiees = sessions.filter((s) => s.statut === "planifiee")
  const enCours = sessions.filter((s) => s.statut === "en_cours")
  const terminees = sessions.filter((s) => s.statut === "terminee")
  const annulees = sessions.filter((s) => s.statut === "annulee")

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D3570]">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">Séances</h1>
            <p className="text-sm text-neutral-500">{sessions.length} séance{sessions.length > 1 ? "s" : ""} au total</p>
          </div>
        </div>
        <Button className="bg-[#0D3570] hover:bg-[#0a2a5c]" onClick={() => setShowForm(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Planifier une séance
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <p className="text-sm text-neutral-500">Aucune séance planifiée pour le moment.</p>
          <Button className="mt-4 bg-[#0D3570] hover:bg-[#0a2a5c]" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Planifier la première séance
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {planifiees.length > 0 && (
            <Section title="Planifiées" count={planifiees.length} color="amber">
              {planifiees.map((s) => (
                <SessionCard key={s.id} session={s} onAttendance={setAttendanceSession} onDelete={handleDelete} />
              ))}
            </Section>
          )}
          {enCours.length > 0 && (
            <Section title="En cours" count={enCours.length} color="blue">
              {enCours.map((s) => (
                <SessionCard key={s.id} session={s} onAttendance={setAttendanceSession} onDelete={handleDelete} />
              ))}
            </Section>
          )}
          {terminees.length > 0 && (
            <Section title="Terminées" count={terminees.length} color="green">
              {terminees.map((s) => (
                <SessionCard key={s.id} session={s} onAttendance={setAttendanceSession} onDelete={handleDelete} />
              ))}
            </Section>
          )}
          {annulees.length > 0 && (
            <Section title="Annulées" count={annulees.length} color="red">
              {annulees.map((s) => (
                <SessionCard key={s.id} session={s} onAttendance={setAttendanceSession} onDelete={handleDelete} />
              ))}
            </Section>
          )}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <SessionFormModal saving={saving} onClose={() => setShowForm(false)} onSubmit={handleCreate} />
      )}
      {attendanceSession && (
        <AttendanceModal
          sessionId={attendanceSession.id}
          sessionTitre={attendanceSession.module?.titre ?? attendanceSession.titre}
          onClose={() => { setAttendanceSession(null); void load() }}
        />
      )}
    </div>
  )
}

function Section({
  title,
  count,
  color,
  children,
}: {
  title: string
  count: number
  color: "amber" | "blue" | "green" | "red"
  children: React.ReactNode
}) {
  const dotColors = {
    amber: "bg-amber-400",
    blue: "bg-blue-400",
    green: "bg-green-400",
    red: "bg-red-400",
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColors[color]}`} />
        <h2 className="text-sm font-semibold text-neutral-700">{title}</h2>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">{count}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  )
}
