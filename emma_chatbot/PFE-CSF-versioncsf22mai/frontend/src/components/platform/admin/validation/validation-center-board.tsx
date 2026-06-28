"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Award, FileText, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ADMIN_DASHBOARD_CARD_CLASS,
  ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS,
  ADMIN_DASHBOARD_CARD_TITLE_CLASS,
} from "@/lib/admin/dashboard-card-styles"
import { ValidationCenterKpis } from "@/components/platform/admin/validation/validation-center-kpis"
import { ValidationQueueTable } from "@/components/platform/admin/validation/validation-queue-table"
import {
  fetchValidationAttributionList,
  fetchValidationQueue,
  fetchValidationStats,
  validateDocument,
  rejectDocument,
  recalculateDocument,
  labelValidationKind,
  type CertificationAttributionItem,
  type ValidationDocKind,
  type ValidationQueueItem,
  type ValidationStats,
} from "@/lib/admin/validation-api"
import { attributionStatusLabels } from "@/components/platform/admin/validation/validation-queue-table"
import { useAdminViewer } from "@/components/platform/admin/admin-viewer-context"
import { CertificateTemplatePreview } from "@/components/platform/admin/validation/certificate-template-preview"
import { cn } from "@/lib/utils"

type BoardState = {
  attribution: CertificationAttributionItem[]
  queue: ValidationQueueItem[]
  selectedRowKey: string | null
  selectedId: number | null
  loading: boolean
}

export function ValidationCenterBoard() {
  const { canWrite } = useAdminViewer()
  const writeValidation = canWrite("validation")
  const [board, setBoard] = useState<BoardState>({
    attribution: [],
    queue: [],
    selectedRowKey: null,
    selectedId: null,
    loading: true,
  })
  const { attribution, queue, selectedRowKey, selectedId, loading } = board

  const [stats, setStats] = useState<ValidationStats | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [actionPending, setActionPending] = useState(false)

  const loadData = useCallback(async () => {
    setBoard((b) => ({ ...b, loading: true }))
    try {
      const [attributionItems, items, st] = await Promise.all([
        fetchValidationAttributionList(),
        fetchValidationQueue(),
        fetchValidationStats(),
      ])
      const firstPending = attributionItems.find(
        (row) => row.validationDocId != null && row.attributionStatus === "pending_admin",
      )
      setBoard({
        attribution: attributionItems,
        queue: items,
        selectedRowKey: firstPending?.rowKey ?? attributionItems[0]?.rowKey ?? null,
        selectedId: firstPending?.validationDocId ?? null,
        loading: false,
      })
      setStats(st)
    } catch (err) {
      setBoard({
        attribution: [],
        queue: [],
        selectedRowKey: null,
        selectedId: null,
        loading: false,
      })
      setStats({ pending_count: 0, validated_this_month: 0, rejected_this_month: 0 })
      toast.error("Impossible de charger les données", {
        description: err instanceof Error ? err.message : "Vérifiez que le backend est démarré.",
      })
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedAttribution = useMemo(
    () => attribution.find((row) => row.rowKey === selectedRowKey) ?? null,
    [attribution, selectedRowKey],
  )

  const selected = useMemo(
    () => queue.find((q) => q.id === selectedId) ?? null,
    [queue, selectedId],
  )

  const pendingAttribution = useMemo(
    () => attribution.filter((row) => row.attributionStatus === "pending_admin" && row.validationDocId != null),
    [attribution],
  )

  const removeFromQueue = useCallback(async () => {
    await loadData()
  }, [loadData])

  const handleValidate = async () => {
    if (!selected || actionPending) return
    setActionPending(true)
    try {
      await validateDocument(selected.id)
      const name = selected.memberName
      await removeFromQueue()
      setStats((s) => s ? { ...s, pending_count: Math.max(0, s.pending_count - 1), validated_this_month: s.validated_this_month + 1 } : s)
      toast.success("Document validé", { description: `Le document pour ${name} a été validé et le PDF généré.` })
    } catch (err) {
      toast.error("Échec de la validation", { description: err instanceof Error ? err.message : "Réessayez." })
    } finally {
      setActionPending(false)
      setRejectOpen(false)
      setRejectReason("")
    }
  }

  const openReject = () => {
    setRejectReason("")
    setRejectOpen(true)
  }

  const confirmReject = async () => {
    if (!selected || actionPending) return
    const reason = rejectReason.trim()
    if (!reason) {
      toast.error("Indiquez un motif de rejet.")
      return
    }
    setActionPending(true)
    try {
      await rejectDocument(selected.id, reason)
      const name = selected.memberName
      await removeFromQueue()
      setStats((s) => s ? { ...s, pending_count: Math.max(0, s.pending_count - 1), rejected_this_month: s.rejected_this_month + 1 } : s)
      toast.message("Document rejeté", {
        description: `${name} — « ${reason.slice(0, 80)}${reason.length > 80 ? "…" : ""} »`,
      })
    } catch (err) {
      toast.error("Échec du rejet", { description: err instanceof Error ? err.message : "Réessayez." })
    } finally {
      setActionPending(false)
      setRejectOpen(false)
      setRejectReason("")
    }
  }

  const handleRecalculate = async () => {
    if (!selected || actionPending) return
    setActionPending(true)
    try {
      const updated = await recalculateDocument(selected.id)
      setBoard((prev) => ({
        ...prev,
        queue: prev.queue.map((q) => (q.id === updated.id ? updated : q)),
        attribution: prev.attribution.map((row) =>
          row.validationDocId === updated.id
            ? {
                ...row,
                presencePercent: updated.presencePercent,
                testScorePercent: updated.testScorePercent,
                systemResult: updated.systemResult,
                systemReason: updated.systemReason,
              }
            : row,
        ),
      }))
      toast.success("Document recalculé", {
        description: `Présence : ${updated.presencePercent}% — ${updated.systemResult === "success" ? "Succès" : "Échec"}`,
      })
    } catch (err) {
      toast.error("Échec du recalcul", { description: err instanceof Error ? err.message : "Réessayez." })
    } finally {
      setActionPending(false)
    }
  }

  const pendingCount = pendingAttribution.length
  const pendingCertificates = useMemo(
    () => pendingAttribution.filter((row) => row.kind === "certificate").length,
    [pendingAttribution],
  )
  const pendingRecommendations = useMemo(
    () => queue.filter((q) => q.kind === "recommendation").length,
    [queue],
  )

  const handleSelectAttribution = (item: CertificationAttributionItem) => {
    setBoard((b) => ({
      ...b,
      selectedRowKey: item.rowKey,
      selectedId: item.validationDocId,
    }))
  }

  return (
    <div className="space-y-8">
      <ValidationCenterKpis
        pendingTotal={pendingCount}
        pendingCertificates={pendingCertificates}
        pendingRecommendations={pendingRecommendations}
        stats={stats}
      />

      <ValidationQueueTable
        items={attribution}
        selectedRowKey={selectedRowKey}
        loading={loading}
        onSelect={handleSelectAttribution}
      />

      <div className="grid min-h-0 gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] lg:items-stretch lg:min-h-[min(72vh,760px)]">
        {/* ── Sidebar ── */}
        <aside className={cn(ADMIN_DASHBOARD_CARD_CLASS, "flex min-h-0 flex-col")}>
          <header className="shrink-0 border-b border-neutral-200/60 pb-4">
            <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>File d&apos;attente</h3>
            <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
              {loading
                ? "Chargement…"
                : pendingCount === 0
                  ? "Aucun document en attente."
                  : `${pendingCount} document${pendingCount > 1 ? "s" : ""} à traiter.`}
            </p>
          </header>

          {loading ? (
            <div className="mt-4 flex min-h-0 flex-1 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-neutral-400" />
            </div>
          ) : pendingAttribution.length === 0 ? (
            <div className="mt-4 flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200/70 bg-white/40 px-4 py-10">
              <p className="text-sm text-neutral-500">La file est vide.</p>
            </div>
          ) : (
            <ul className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
              {pendingAttribution.map((item) => (
                <li key={item.rowKey}>
                  <button
                    type="button"
                    onClick={() => handleSelectAttribution(item)}
                    className={cn(
                      "flex w-full flex-col gap-1.5 rounded-xl border px-3 py-3 text-left transition-colors",
                      selectedRowKey === item.rowKey
                        ? "border-[#0D3570] bg-white shadow-sm ring-1 ring-[#0D3570]/15"
                        : "border-neutral-200/80 bg-white/80 hover:border-neutral-300 hover:bg-white",
                    )}
                  >
                    <span className="self-start">
                      <KindBadge kind={item.kind} />
                    </span>
                    <span className="truncate text-sm font-semibold text-[#0f172a]">{item.memberName}</span>
                    <span className="truncate text-xs text-neutral-600">{item.formationLabel}</span>
                    {item.submittedAt && (
                      <span className="text-[10px] text-neutral-400">
                        Soumis le{" "}
                        {new Date(item.submittedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* ── Viewer ── */}
        <section className={cn(ADMIN_DASHBOARD_CARD_CLASS, "flex min-h-0 min-w-0 flex-col")}>
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-neutral-400" />
            </div>
          ) : !selected && selectedAttribution ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <p className="text-sm font-medium text-[#0f172a]">{selectedAttribution.memberName}</p>
              <p className="mt-1 text-sm text-neutral-600">{selectedAttribution.formationLabel}</p>
              <p className="mt-4 max-w-md text-sm text-neutral-500">
                {selectedAttribution.attributionStatus === "not_ready" &&
                  "Aucune séance enregistrée pour calculer la présence. Le certificat sera proposé dès que des séances seront planifiées et pointées."}
                {selectedAttribution.attributionStatus === "validated" &&
                  "Le certificat a déjà été délivré pour cette inscription."}
                {selectedAttribution.attributionStatus === "rejected" &&
                  "Le dossier de certification a été rejeté. Rechargez la page après une nouvelle soumission."}
                {selectedAttribution.attributionStatus === "ready_no_doc" &&
                  `Présence : ${selectedAttribution.presencePercent} % (${selectedAttribution.totalSessions} séance(s)). Rechargez la page pour générer le dossier de certification.`}
                {selectedAttribution.attributionStatus === "pending_admin" &&
                  `Présence : ${selectedAttribution.presencePercent} % — dossier en attente de validation admin.`}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {attributionStatusLabels[selectedAttribution.attributionStatus]}
              </p>
            </div>
          ) : !selected ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-neutral-500">Sélectionnez un document dans la file d&apos;attente.</p>
            </div>
          ) : (
            <>
              <header className="shrink-0 border-b border-neutral-200/60 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Diagnostic système</h3>
                    <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
                      Résultat automatique pour ce document.
                    </p>
                  </div>
                  <KindBadge kind={selected.kind} large />
                </div>
                <p className="mt-3 text-sm text-neutral-700">
                  <span className="font-medium text-[#0f172a]">{selected.memberName}</span>
                  {" · "}
                  <span className="text-neutral-600">{selected.memberEmail}</span>
                  {" · "}
                  <span className="text-neutral-500">{selected.groupName}</span>
                </p>

                {/* Diagnostic grid */}
                <dl className="mt-4 grid gap-3 rounded-xl border border-neutral-200/80 bg-white px-4 py-3 text-sm shadow-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Présence</dt>
                    <dd className="mt-1 font-semibold tabular-nums text-[#0f172a]">{selected.presencePercent} %</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Absences</dt>
                    <dd className="mt-1 font-semibold tabular-nums text-[#0f172a]">
                      {selected.absenceCount} séance{selected.absenceCount > 1 ? "s" : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Score test</dt>
                    <dd className="mt-1 font-semibold tabular-nums text-[#0f172a]">
                      {selected.testScorePercent != null ? `${selected.testScorePercent} %` : "—"}
                    </dd>
                  </div>
                </dl>

                {/* System result badge */}
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
                      selected.systemResult === "success"
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
                        : "bg-red-50 text-red-800 ring-red-600/20",
                    )}
                  >
                    {selected.systemResult === "success" ? "Succès automatique" : "Échec automatique"}
                  </span>
                  <span className="text-xs text-neutral-500">{selected.systemReason}</span>
                </div>
              </header>

              {/* Absence detail */}
              {selected.absenceSessions.length > 0 && (
                <div className="mt-4 shrink-0">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Séances manquées</h4>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
                    {selected.absenceSessions.map((s) => (
                      <li key={s.session_id} className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-1.5">
                        <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
                        <span className="truncate font-medium text-neutral-700">{s.title}</span>
                        {s.scheduled_at && (
                          <span className="ml-auto shrink-0 text-xs text-neutral-400">
                            {new Date(s.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Certificate / Recommendation preview */}
              <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-neutral-200/90 bg-neutral-100/80 p-4 shadow-inner">
                <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md">
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {selected.kind === "certificate" ? (
                      <CertificateTemplatePreview
                        doc={selected}
                        fallback={<CertificatePreview doc={selected} />}
                      />
                    ) : (
                      <RecommendationPreview doc={selected} />
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 shrink-0 flex flex-col gap-3 border-t border-neutral-200/60 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <p className="text-xs text-neutral-500">
                  {writeValidation
                    ? "La validation déclenche la génération du PDF et l'envoi d'un email à l'apprenant."
                    : "Consultation seule : les actions de validation sont réservées à l'administrateur."}
                </p>
                {writeValidation ? (
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={handleRecalculate}
                    disabled={actionPending}
                  >
                    {actionPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Recalculer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={openReject}
                    disabled={actionPending}
                  >
                    Rejeter
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#0D3570] hover:bg-[#0a2d5c]"
                    onClick={handleValidate}
                    disabled={actionPending}
                  >
                    {actionPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Valider
                  </Button>
                </div>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Reject modal ── */}
      {rejectOpen && selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-dialog-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h4 id="reject-dialog-title" className="text-base font-semibold text-[#0f172a]">
                Motif du rejet
              </h4>
              <button
                type="button"
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Fermer"
                onClick={() => setRejectOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Ce message sera communiqué à {selected.memberName} par email.
            </p>
            <Textarea
              className="mt-4 min-h-[120px] border-neutral-200 text-sm focus-visible:border-[#0D3570] focus-visible:ring-[#0D3570]/25"
              placeholder="Ex. : informations d'identité incomplètes, incohérence avec le dossier pédagogique…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)} disabled={actionPending}>
                Annuler
              </Button>
              <Button type="button" variant="destructive" onClick={confirmReject} disabled={actionPending}>
                {actionPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Confirmer le rejet
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function KindBadge({ kind, large }: { kind: ValidationDocKind; large?: boolean }) {
  const Icon = kind === "certificate" ? Award : FileText
  const label = labelValidationKind(kind)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
        kind === "certificate"
          ? "bg-emerald-50 text-emerald-900 ring-emerald-600/20"
          : "bg-sky-50 text-sky-900 ring-sky-600/20",
        large && "px-3 py-1 text-xs",
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", large && "size-4")} aria-hidden />
      {label}
    </span>
  )
}

function CertificatePreview({ doc }: { doc: ValidationQueueItem }) {
  const dateStr = doc.submittedAt
    ? new Date(doc.submittedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="relative px-10 py-8">
      {/* Double border frame */}
      <div className="absolute inset-3 rounded border-[3px] border-[#1a365d]" />
      <div className="absolute inset-5 rounded border border-[#b7c6d8]" />

      <div className="relative flex flex-col items-center gap-5 px-6 py-6 text-center">
        {/* Header */}
        <div>
          <div className="text-xl font-bold tracking-[4px] text-[#1a365d]">CSF</div>
          <div className="text-[10px] uppercase tracking-[2px] text-neutral-500">
            Centre de Services et de Formation
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-40 bg-gradient-to-r from-transparent via-[#1a365d] to-transparent" />

        {/* Title */}
        <div>
          <h3 className="font-serif text-2xl font-bold uppercase tracking-[5px] text-[#1a365d]">
            Certificat de Formation
          </h3>
          <p className="mt-1 text-[11px] italic text-neutral-500">Formation professionnelle continue</p>
        </div>

        {/* Body */}
        <div className="max-w-md space-y-2">
          <p className="text-[13px] text-neutral-600">Le Centre de Services et de Formation certifie que</p>
          <p className="border-b-2 border-[#b7c6d8] pb-1 font-serif text-2xl font-bold text-[#1a365d]">
            {doc.memberName}
          </p>
          <p className="text-[13px] text-neutral-600">a suivi avec assiduité la formation</p>
          <p className="text-base font-bold text-[#2b6cb0]">« {doc.scopeLabel} »</p>
          <p className="text-[13px] text-neutral-600">
            et a satisfait aux exigences de présence et d&apos;évaluation requises.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-10 py-2">
          <div className="text-center">
            <div className="text-xl font-bold text-[#1a365d]">{doc.presencePercent}%</div>
            <div className="text-[9px] uppercase tracking-[1px] text-neutral-500">Présence</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#1a365d]">{doc.absenceCount}</div>
            <div className="text-[9px] uppercase tracking-[1px] text-neutral-500">Absence(s)</div>
          </div>
          <div className="text-center">
            <span
              className={cn(
                "inline-block rounded px-3 py-1 text-xs font-bold uppercase tracking-[1px]",
                doc.systemResult === "success"
                  ? "border border-green-300 bg-green-50 text-green-800"
                  : "border border-red-300 bg-red-50 text-red-800",
              )}
            >
              {doc.systemResult === "success" ? "Validé" : "Non validé"}
            </span>
            <div className="mt-1 text-[9px] uppercase tracking-[1px] text-neutral-500">Résultat</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-40 bg-gradient-to-r from-transparent via-[#1a365d] to-transparent" />

        {/* Signatures */}
        <div className="flex w-full justify-between px-4">
          <div className="text-center">
            <div className="mx-auto mb-1 w-28 border-t border-neutral-400" />
            <div className="text-[11px] font-bold text-neutral-700">Le Directeur Pédagogique</div>
            <div className="text-[10px] text-neutral-500">CSF Formation</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-[11px] text-neutral-500">Fait le {dateStr}</div>
            <div className="mx-auto mb-1 w-28 border-t border-neutral-400" />
            <div className="text-[11px] font-bold text-neutral-700">Cachet et Signature</div>
            <div className="text-[10px] text-neutral-500">Centre de Services et de Formation</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex w-full justify-between text-[9px] text-neutral-400">
          <span>Réf. : CERT-{doc.id}</span>
          <span>CSF — Centre de Services et de Formation</span>
        </div>
      </div>
    </div>
  )
}

function RecommendationPreview({ doc }: { doc: ValidationQueueItem }) {
  const dateStr = doc.submittedAt
    ? new Date(doc.submittedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="px-10 py-8 text-left">
      {/* Letterhead */}
      <div className="flex items-start justify-between border-b-[3px] border-[#1a365d] pb-3">
        <div>
          <div className="text-xl font-bold tracking-[3px] text-[#1a365d]">CSF</div>
          <div className="text-[10px] uppercase tracking-[1px] text-neutral-500">Centre de Services et de Formation</div>
        </div>
        <div className="text-right text-[11px] text-neutral-500">{dateStr}</div>
      </div>

      {/* Title */}
      <h3 className="mt-8 text-center font-serif text-xl font-bold uppercase tracking-[4px] text-[#1a365d]">
        Lettre de Recommandation
      </h3>
      <div className="mx-auto mt-2 h-px w-32 bg-gradient-to-r from-transparent via-[#1a365d] to-transparent" />

      {/* Body */}
      <div className="mt-6 space-y-4 text-[13px] leading-[1.8] text-neutral-700">
        <p>
          <span className="font-bold text-neutral-800">Objet :</span> Recommandation de{" "}
          <span className="font-bold text-[#1a365d]">{doc.memberName}</span> suite à la formation{" "}
          « <span className="font-bold text-[#2b6cb0]">{doc.scopeLabel}</span> ».
        </p>

        <p>Madame, Monsieur,</p>

        <p>
          Le Centre de Services et de Formation a le plaisir d&apos;attester que{" "}
          <span className="font-bold text-[#1a365d]">{doc.memberName}</span> a suivi la formation{" "}
          « <span className="font-bold">{doc.scopeLabel}</span> » dispensée au sein de notre établissement.
        </p>

        <p>
          Au cours de cette formation, l&apos;apprenant a fait preuve d&apos;assiduité, de rigueur et d&apos;un réel
          engagement dans l&apos;acquisition des compétences visées.
        </p>
      </div>

      {/* Summary table */}
      <table className="mt-6 w-full text-[12px]">
        <tbody>
          <tr className="border-b border-neutral-200">
            <td className="w-[42%] py-2 font-bold text-neutral-500">Apprenant</td>
            <td className="py-2 text-neutral-800">{doc.memberName}</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 font-bold text-neutral-500">Formation / Module</td>
            <td className="py-2 text-neutral-800">{doc.scopeLabel}</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 font-bold text-neutral-500">Taux de présence</td>
            <td className="py-2 text-neutral-800">{doc.presencePercent} %</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 font-bold text-neutral-500">Score d&apos;évaluation</td>
            <td className="py-2 text-neutral-800">{doc.testScorePercent != null ? `${doc.testScorePercent} %` : "N/A"}</td>
          </tr>
          <tr className="border-b border-neutral-200">
            <td className="py-2 font-bold text-neutral-500">Avis</td>
            <td className="py-2">
              <span
                className={cn(
                  "inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase",
                  doc.systemResult === "success"
                    ? "border border-green-300 bg-green-50 text-green-800"
                    : "border border-red-300 bg-red-50 text-red-800",
                )}
              >
                {doc.systemResult === "success" ? "Recommandé" : "Non recommandé"}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-6 text-[13px] leading-[1.8] text-neutral-700">
        En foi de quoi, nous recommandons vivement <span className="font-bold text-[#1a365d]">{doc.memberName}</span>{" "}
        pour ses compétences professionnelles et son engagement tout au long de la formation.
      </p>

      <p className="mt-3 text-[13px] text-neutral-700">
        Veuillez agréer, Madame, Monsieur, l&apos;expression de nos salutations distinguées.
      </p>

      {/* Signature */}
      <div className="mt-10 text-right">
        <div className="ml-auto w-40">
          <div className="border-t border-neutral-400" />
          <div className="mt-1 text-[11px] font-bold text-neutral-700">Le Directeur Pédagogique</div>
          <div className="text-[10px] text-neutral-500">CSF — Centre de Services et de Formation</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-between border-t border-neutral-200 pt-3 text-[9px] text-neutral-400">
        <span>Réf. : REC-{doc.id}</span>
        <span>CSF</span>
      </div>
    </div>
  )
}
