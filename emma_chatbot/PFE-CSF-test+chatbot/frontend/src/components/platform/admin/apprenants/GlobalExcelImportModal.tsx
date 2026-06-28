"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import NewMemberConfirmDialog from "@/components/platform/admin/apprenants/NewMemberConfirmDialog"
import {
  globalConfirmAttendanceImport,
  globalImportAttendancePreview,
  type AttendanceStatus,
  type ConfirmImportRow,
  type GlobalAttendanceImportPreview,
  type ImportRow,
  type SessionImportGroup,
  type SessionImportGroupConfirm,
} from "@/lib/admin/apprenants-api"
import { cn } from "@/lib/utils"

type Props = {
  groupId: string
  sessionLabel: string
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

function formatDateKey(dateKey: string): string {
  const parts = dateKey.split("-")
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return dateKey
}

function defaultSessionTitle(grp: SessionImportGroup): string {
  return grp.sessionTitle || `Séance ${formatDateKey(grp.dateKey)}`
}

function collectNewEmails(groups: SessionImportGroup[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const grp of groups) {
    for (const r of grp.rows) {
      if (r.resolution !== "new") continue
      const key = r.email.trim().toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(r.email.trim())
    }
  }
  return out
}

function buildGlobalConfirmPayload(
  preview: GlobalAttendanceImportPreview,
  statusEdits: Record<number, Record<number, AttendanceStatus>>,
  sessionDecisions: Record<number, { create: boolean; title: string }>,
  newDecisions: Record<string, boolean>,
): SessionImportGroupConfirm[] {
  const out: SessionImportGroupConfirm[] = []
  preview.groups.forEach((grp, groupIdx) => {
    const decision = sessionDecisions[groupIdx]
    const canProcess = !!grp.sessionId || decision?.create
    if (!canProcess) return

    const rows: ConfirmImportRow[] = []
    for (const row of grp.rows) {
      if (row.resolution === "error") continue
      const statut = statusEdits[groupIdx]?.[row.rowIndex] ?? row.statut
      if (statut !== "present" && statut !== "absent" && statut !== "excused") continue
      if (row.resolution === "found") {
        rows.push({ email: row.email.trim(), statut, createIfNew: false })
      } else if (row.resolution === "new") {
        const email = row.email.trim()
        rows.push({
          email,
          statut,
          createIfNew: newDecisions[email.toLowerCase()] ?? false,
        })
      }
    }
    if (rows.length === 0 && !grp.sessionId && !decision?.create) return

    out.push({
      dateKey: grp.dateKey,
      heureKey: grp.heureKey,
      sessionId: grp.sessionId,
      createSession: !grp.sessionId && !!decision?.create,
      sessionTitle: decision?.title || grp.sessionTitle || defaultSessionTitle(grp),
      rows,
    })
  })
  return out
}

function countValidGlobalRows(
  preview: GlobalAttendanceImportPreview,
  statusEdits: Record<number, Record<number, AttendanceStatus>>,
  sessionDecisions: Record<number, { create: boolean; title: string }>,
): number {
  let n = 0
  preview.groups.forEach((grp, groupIdx) => {
    const decision = sessionDecisions[groupIdx]
    if (!grp.sessionId && !decision?.create) return
    for (const row of grp.rows) {
      if (row.resolution === "error") continue
      const statut = statusEdits[groupIdx]?.[row.rowIndex] ?? row.statut
      if (statut === "present" || statut === "absent" || statut === "excused") n += 1
    }
  })
  return n
}

function SummaryChip({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color?: "amber" | "blue" | "red"
}) {
  const border =
    color === "amber"
      ? "border-amber-200 bg-amber-50"
      : color === "red"
        ? "border-red-200 bg-red-50"
        : color === "blue"
          ? "border-blue-200 bg-blue-50"
          : "border-neutral-200 bg-neutral-50"
  return (
    <div className={cn("flex-1 rounded-lg border px-3 py-2 text-center", border)}>
      <p className="text-xs text-neutral-600">{label}</p>
      <p className="text-lg font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

function resolutionBadge(row: ImportRow) {
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

export default function GlobalExcelImportModal({ groupId, sessionLabel, onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>("upload")
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [preview, setPreview] = useState<GlobalAttendanceImportPreview | null>(null)
  const [statusEdits, setStatusEdits] = useState<Record<number, Record<number, AttendanceStatus>>>({})
  const [sessionDecisions, setSessionDecisions] = useState<
    Record<number, { create: boolean; title: string }>
  >({})

  const runUpload = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".xlsx")) {
        toast.error("Veuillez choisir un fichier .xlsx.")
        return
      }
      setLoading(true)
      try {
        const data = await globalImportAttendancePreview(groupId, file)
        setPreview(data)
        setFileName(file.name)

        const initStatus: Record<number, Record<number, AttendanceStatus>> = {}
        const initSessions: Record<number, { create: boolean; title: string }> = {}
        data.groups.forEach((grp, groupIdx) => {
          const rowMap: Record<number, AttendanceStatus> = {}
          for (const r of grp.rows) {
            if (r.resolution === "error") continue
            rowMap[r.rowIndex] = defaultStatusForRow(r)
          }
          initStatus[groupIdx] = rowMap
          if (grp.sessionResolution === "missing") {
            initSessions[groupIdx] = { create: true, title: defaultSessionTitle(grp) }
          }
        })
        setStatusEdits(initStatus)
        setSessionDecisions(initSessions)
        setPhase("preview")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Échec de l’analyse du fichier.")
      } finally {
        setLoading(false)
      }
    },
    [groupId],
  )

  const newEmails = useMemo(() => (preview ? collectNewEmails(preview.groups) : []), [preview])

  const validRowCount = useMemo(
    () =>
      preview ? countValidGlobalRows(preview, statusEdits, sessionDecisions) : 0,
    [preview, statusEdits, sessionDecisions],
  )

  const submitGlobalImport = useCallback(
    async (newDecisions: Record<string, boolean>) => {
      if (!preview) return
      const groups = buildGlobalConfirmPayload(
        preview,
        statusEdits,
        sessionDecisions,
        newDecisions,
      )
      if (groups.length === 0) {
        toast.error("Aucune séance à traiter.")
        return
      }
      setLoading(true)
      try {
        const summary = await globalConfirmAttendanceImport(groupId, groups)
        if (summary.sessionsCreated > 0) {
          toast.success(
            `Import terminé : ${summary.sessionsCreated} séances créées, ${summary.attendancesSet} présences enregistrées`,
          )
        } else {
          toast.success(`Import terminé : ${summary.attendancesSet} présences enregistrées`)
        }
        onSuccess()
        onClose()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Enregistrement impossible.")
      } finally {
        setLoading(false)
      }
    },
    [preview, statusEdits, sessionDecisions, groupId, onSuccess, onClose],
  )

  const handleConfirmClick = () => {
    if (!preview || validRowCount === 0) return
    if (newEmails.length > 0) {
      setPhase("confirming")
      return
    }
    void submitGlobalImport({})
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-excel-import-title"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="global-excel-import-title" className="text-lg font-semibold text-neutral-900">
              Import global de présences
            </h2>
            <p className="mt-1 truncate text-sm text-neutral-600">{sessionLabel}</p>
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
                Format attendu : colonnes date, heure, email, statut — plusieurs séances possibles
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
            <div className="space-y-5">
              <p className="text-sm text-neutral-700">
                Fichier : <span className="font-medium">{fileName}</span> · {preview.totalRows} lignes
              </p>
              <div className="flex flex-wrap gap-3">
                <SummaryChip label="Séances détectées" value={preview.groups.length} />
                <SummaryChip label="À créer" value={preview.missingSessions} color="amber" />
                <SummaryChip
                  label="Présences"
                  value={preview.totalRows - preview.totalErrors}
                  color="blue"
                />
                <SummaryChip label="Erreurs" value={preview.totalErrors} color="red" />
              </div>

              {preview.groups.map((grp, groupIdx) => (
                <section
                  key={`${grp.dateKey}-${grp.heureKey}-${groupIdx}`}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-900">
                      {formatDateKey(grp.dateKey)}
                      {grp.heureKey ? ` · ${grp.heureKey}` : ""}
                    </span>
                    {grp.sessionResolution === "found" ? (
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        ✓ Séance trouvée
                        {grp.sessionTitle ? ` — ${grp.sessionTitle}` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                        ⚠ Séance introuvable
                      </span>
                    )}
                    <span className="text-xs text-neutral-500">
                      {grp.foundCount} trouvés · {grp.newCount} nouveaux · {grp.errorCount} erreurs
                    </span>
                  </div>

                  {grp.sessionResolution === "missing" ? (
                    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                      <label className="flex items-center gap-2 text-sm text-neutral-800">
                        <input
                          type="checkbox"
                          checked={sessionDecisions[groupIdx]?.create ?? false}
                          onChange={(e) =>
                            setSessionDecisions((prev) => ({
                              ...prev,
                              [groupIdx]: {
                                create: e.target.checked,
                                title: prev[groupIdx]?.title ?? defaultSessionTitle(grp),
                              },
                            }))
                          }
                        />
                        Créer cette séance
                      </label>
                      <input
                        className="min-w-[200px] flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm outline-none ring-blue-500 focus:ring-2 disabled:opacity-50"
                        value={sessionDecisions[groupIdx]?.title ?? defaultSessionTitle(grp)}
                        disabled={!(sessionDecisions[groupIdx]?.create ?? false)}
                        onChange={(e) =>
                          setSessionDecisions((prev) => ({
                            ...prev,
                            [groupIdx]: {
                              create: prev[groupIdx]?.create ?? true,
                              title: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  ) : null}

                  <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="bg-neutral-100 text-neutral-700">
                        <tr>
                          <th className="px-3 py-2 font-medium">Email</th>
                          <th className="px-3 py-2 font-medium">Statut</th>
                          <th className="px-3 py-2 font-medium">Résolution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {grp.rows.map((row) => {
                          const isError = row.resolution === "error"
                          return (
                            <tr
                              key={row.rowIndex}
                              className={cn(isError && "bg-red-50/90")}
                              title={isError ? row.errorMessage ?? undefined : undefined}
                            >
                              <td className="px-3 py-2 text-neutral-900">{row.email}</td>
                              <td className="px-3 py-2">
                                {isError ? (
                                  <span className="text-neutral-500">—</span>
                                ) : (
                                  <select
                                    className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm outline-none ring-blue-500 focus:ring-2"
                                    value={
                                      statusEdits[groupIdx]?.[row.rowIndex] ??
                                      defaultStatusForRow(row)
                                    }
                                    onChange={(e) =>
                                      setStatusEdits((prev) => ({
                                        ...prev,
                                        [groupIdx]: {
                                          ...prev[groupIdx],
                                          [row.rowIndex]: e.target.value as AttendanceStatus,
                                        },
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
                </section>
              ))}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-blue-700 text-white hover:bg-blue-800"
                  disabled={loading || validRowCount === 0}
                  onClick={handleConfirmClick}
                >
                  Confirmer et enregistrer ({validRowCount} présences)
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
                    setSessionDecisions({})
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
          onCancel={() => setPhase("preview")}
          onResult={(decisions) => {
            void submitGlobalImport(decisions)
          }}
        />
      ) : null}
    </div>
  )
}
