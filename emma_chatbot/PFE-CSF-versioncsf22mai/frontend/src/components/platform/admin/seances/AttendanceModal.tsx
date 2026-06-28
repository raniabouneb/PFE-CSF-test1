"use client"

import { useEffect, useState } from "react"
import { X, Check, Minus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAttendance, useSaveAttendance } from "@/lib/hooks"

type Props = {
  sessionId: string
  sessionTitre: string
  onClose: () => void
}

export default function AttendanceModal({ sessionId, sessionTitre, onClose }: Props) {
  const { data: serverEntries, isLoading: loading } = useAttendance(sessionId)
  const saveAttendance = useSaveAttendance()

  const [localPresence, setLocalPresence] = useState<Map<string, boolean>>(new Map())
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (serverEntries && !initialized) {
      const map = new Map<string, boolean>()
      for (const e of serverEntries) map.set(e.apprenant_id, e.present)
      setLocalPresence(map)
      setInitialized(true)
    }
  }, [serverEntries, initialized])

  const entries = serverEntries ?? []

  const toggle = (apprenantId: string) => {
    setLocalPresence((prev) => {
      const next = new Map(prev)
      next.set(apprenantId, !prev.get(apprenantId))
      return next
    })
  }

  const markAll = (present: boolean) => {
    setLocalPresence((prev) => {
      const next = new Map(prev)
      for (const key of next.keys()) next.set(key, present)
      return next
    })
  }

  const dirty = entries.some(
    (e) => localPresence.get(e.apprenant_id) !== e.present,
  )

  const save = async () => {
    const records = entries.map((e) => ({
      apprenant_id: e.apprenant_id,
      present: localPresence.get(e.apprenant_id) ?? e.present,
    }))
    try {
      await saveAttendance.mutateAsync({ sessionId, records })
      toast.success("Présences enregistrées — progression recalculée")
      onClose()
    } catch {
      toast.error("Erreur enregistrement des présences")
    }
  }

  const presentCount = entries.filter(
    (e) => localPresence.get(e.apprenant_id) ?? e.present,
  ).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-[#0f172a]">Présences</h3>
            <p className="text-sm text-neutral-500">{sessionTitre}</p>
          </div>
          <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {loading ? (
            <div className="max-h-[350px] space-y-1.5 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
                  <div className="h-7 w-7 rounded-full bg-neutral-200" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3.5 w-2/3 rounded bg-neutral-200" />
                    <div className="h-3 w-1/3 rounded bg-neutral-200" />
                  </div>
                  <div className="h-4 w-16 rounded-full bg-neutral-200" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">Aucun apprenant inscrit pour cette séance.</p>
          ) : (
            <>
              {/* Bulk actions */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  {presentCount}/{entries.length} présent{presentCount > 1 ? "s" : ""}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => markAll(true)}
                    className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                  >
                    Tous présents
                  </button>
                  <button
                    type="button"
                    onClick={() => markAll(false)}
                    className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Tous absents
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[350px] space-y-1.5 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                {entries.map((entry) => {
                  const isPresent = localPresence.get(entry.apprenant_id) ?? entry.present
                  return (
                    <div
                      key={entry.apprenant_id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                        isPresent ? "border-green-200 bg-green-50/60" : "border-neutral-200 bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(entry.apprenant_id)}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                          isPresent
                            ? "bg-green-500 text-white"
                            : "bg-neutral-200 text-neutral-500 hover:bg-neutral-300"
                        }`}
                      >
                        {isPresent ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {entry.first_name ?? ""} {entry.last_name ?? ""}
                        </p>
                        <p className="truncate text-xs text-neutral-500">{entry.email}</p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          entry.enrollment_type === "ponctuelle"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {entry.enrollment_type}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-neutral-100 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button
            type="button"
            className="bg-[#0D3570] hover:bg-[#0a2a5c]"
            onClick={() => void save()}
            disabled={saveAttendance.isPending || !dirty}
          >
            {saveAttendance.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Enregistrer les présences"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
