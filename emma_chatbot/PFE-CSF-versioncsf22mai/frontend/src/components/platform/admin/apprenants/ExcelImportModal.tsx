"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import NewMemberConfirmDialog from "@/components/platform/admin/apprenants/NewMemberConfirmDialog"
import {
  confirmAttendanceImport,
  importAttendancePreview,
  type AttendanceImportPreview,
  type AttendanceStatus,
  type ConfirmImportRow,
  type ImportRow,
} from "@/lib/admin/apprenants-api"
import { cn } from "@/lib/utils"

type Props = {
  sessionId: string
  sessionTitle: string
  onClose: () => void
  onSuccess: () => void
}

type Phase = "upload" | "preview" | "confirming"

const STATUS_OPTIONS: AttendanceStatus[] = ["present", "absent", "excused"]

function defaultStatusForRow(row: ImportRow): AttendanceStatus {
  if (row.statut === "present" || row.statut === "absent" || row.statut === "excused") {
    return row.statut
  }
  return "present"
}

function collectNewEmails(rows: ImportRow[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of rows) {
    if (r.resolution !== "new") continue
    const key = r.email.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r.email.trim())
  }
  return out
}

function buildConfirmPayload(
  preview: AttendanceImportPreview,
  statusEdits: Record<number, AttendanceStatus>,
  newDecisions: Record<string, boolean>,
): ConfirmImportRow[] {
  const out: ConfirmImportRow[] = []
  for (const row of preview.rows) {
    if (row.resolution === "error") continue
    const statut = statusEdits[row.rowIndex] ?? row.statut
    if (statut !== "present" && statut !== "absent" && statut !== "excused") continue
    if (row.resolution === "found") {
      out.push({ email: row.email.trim(), statut, createIfNew: false })
    } else if (row.resolution === "new") {
      const email = row.email.trim()
      out.push({
        email,
        statut,
        createIfNew: newDecisions[email.toLowerCase()] ?? false,
      })
    }
  }
  return out
}

function countValidImportRows(
  preview: AttendanceImportPreview,
  statusEdits: Record<number, AttendanceStatus>,
): number {
  let n = 0
  for (const row of preview.rows) {
    if (row.resolution === "error") continue
    const statut = statusEdits[row.rowIndex] ?? row.statut
    if (statut === "present" || statut === "absent" || statut === "excused") n += 1
  }
  return n
}

export default function ExcelImportModal({ sessionId, sessionTitle, onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>("upload")
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [preview, setPreview] = useState<AttendanceImportPreview | null>(null)
  const [statusEdits, setStatusEdits] = useState<Record<number, AttendanceStatus>>({})

  const runUpload = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".xlsx")) {
        toast.error("Veuillez choisir un fichier .xlsx.")
        return
      }
      setLoading(true)
      try {
        const data = await importAttendancePreview(sessionId, file)
        setPreview(data)
        setFileName(file.name)
        const init: Record<number, AttendanceStatus> = {}
        for (const r of data.rows) {
          if (r.resolution === "error") continue
          init[r.rowIndex] = defaultStatusForRow(r)
        }
        setStatusEdits(init)
        setPhase("preview")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Échec de l’analyse du fichier.")
      } finally {
        setLoading(false)
      }
    },
    [sessionId],
  )

  const newEmails = useMemo(() => (preview ? collectNewEmails(preview.rows) : []), [preview])

  const validRowCount = useMemo(
    () => (preview ? countValidImportRows(preview, statusEdits) : 0),
    [preview, statusEdits],
  )

  const submitImport = useCallback(
    async (newDecisions: Record<string, boolean>) => {
      if (!preview) return
      const rows = buildConfirmPayload(preview, statusEdits, newDecisions)
      if (rows.length === 0) {
        toast.error("Aucune ligne valide à enregistrer.")
        return
      }
      setPhase("preview")
      setLoading(true)
      try {
        await confirmAttendanceImport(sessionId, rows)
        toast.success("Présences importées avec succès")
        onSuccess()
        onClose()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Enregistrement impossible.")
      } finally {
        setLoading(false)
      }
    },
    [preview, statusEdits, sessionId, onSuccess, onClose],
  )

  const handleConfirmClick = () => {
    if (!preview || validRowCount === 0) return
    if (newEmails.length > 0) {
      setPhase("confirming")
      return
    }
    void submitImport({})
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const f = e.dataTransfer.files[0]
    if (f) void runUpload(f)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
  }

  const resolutionBadge = (row: ImportRow) => {
    if (row.resolution === "found") {
      return (
        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
          ✓ Trouvé
        </span>
      )
    }
    if (row.resolution === "new") {
      return (
        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
          ⚠ Nouveau
        </span>
      )
    }
    return (
      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800">
        ✗ Erreur
      </span>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="excel-import-title"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="excel-import-title" className="text-lg font-semibold text-neutral-900">
              Import de présences
            </h2>
            <p className="mt-1 truncate text-sm text-neutral-600">{sessionTitle}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading && phase !== "confirming" ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <Loader2 className="h-10 w-10 animate-spin text-blue-700" aria-hidden />
            </div>
          ) : null}

          {phase === "upload" ? (
            <div
              className={cn(
                "flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-10 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30",
                loading && "pointer-events-none opacity-60",
              )}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              role="button"
              tabIndex={0}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void runUpload(f)
                  e.target.value = ""
                }}
              />
              <p className="text-sm font-medium text-neutral-800">
                Glissez votre fichier Excel ici ou cliquez pour sélectionner
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Format attendu : colonnes date, heure, email, statut
              </p>
              <Button
                type="button"
                className="mt-4 bg-blue-700 text-white hover:bg-blue-800"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                Choisir un fichier
              </Button>
            </div>
          ) : null}

          {phase === "preview" && preview ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-700">
                Fichier chargé : <span className="font-medium">{fileName}</span> · {preview.rows.length}{" "}
                lignes détectées
              </p>
              <div className="overflow-x-auto rounded-xl border border-neutral-200">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-neutral-100 text-neutral-700">
                    <tr>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Heure</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Statut</th>
                      <th className="px-3 py-2 font-medium">Résolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {preview.rows.map((row) => {
                      const isError = row.resolution === "error"
                      return (
                        <tr
                          key={row.rowIndex}
                          className={cn("bg-white", isError && "bg-red-50/90")}
                          title={isError ? row.errorMessage ?? undefined : undefined}
                        >
                          <td className="px-3 py-2 text-neutral-800">{row.date ?? "—"}</td>
                          <td className="px-3 py-2 text-neutral-800">{row.heure ?? "—"}</td>
                          <td className="px-3 py-2 text-neutral-900">{row.email}</td>
                          <td className="px-3 py-2">
                            {isError ? (
                              <span className="text-neutral-500">—</span>
                            ) : (
                              <select
                                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm outline-none ring-blue-500 focus:ring-2"
                                value={statusEdits[row.rowIndex] ?? defaultStatusForRow(row)}
                                onChange={(e) =>
                                  setStatusEdits((prev) => ({
                                    ...prev,
                                    [row.rowIndex]: e.target.value as AttendanceStatus,
                                  }))
                                }
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <div className="flex flex-col gap-1">
                              {resolutionBadge(row)}
                              {isError && row.errorMessage ? (
                                <span className="text-xs text-red-700">{row.errorMessage}</span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-neutral-600">
                {preview.foundCount} trouvés · {preview.newCount} nouveaux · {preview.errorCount} erreurs
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-blue-700 text-white hover:bg-blue-800"
                  disabled={loading || validRowCount === 0}
                  onClick={handleConfirmClick}
                >
                  Confirmer et enregistrer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    setPhase("upload")
                    setPreview(null)
                    setFileName("")
                    setStatusEdits({})
                  }}
                >
                  Changer de fichier
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {phase === "confirming" && newEmails.length > 0 ? (
        <NewMemberConfirmDialog
          emails={newEmails}
          onCancel={() => {
            setPhase("preview")
          }}
          onResult={(decisions) => {
            void submitImport(decisions)
          }}
        />
      ) : null}
    </div>
  )
}
