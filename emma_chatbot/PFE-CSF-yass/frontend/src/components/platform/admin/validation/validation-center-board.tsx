"use client"

import { useCallback, useMemo, useState } from "react"
import { Award, FileText, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ADMIN_DASHBOARD_CARD_CLASS,
  ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS,
  ADMIN_DASHBOARD_CARD_TITLE_CLASS,
} from "@/lib/admin/dashboard-card-styles"
import { ValidationCenterKpis } from "@/components/platform/admin/validation/validation-center-kpis"
import {
  createInitialValidationQueue,
  labelValidationKind,
  type ValidationDocKind,
  type ValidationQueueItem,
} from "@/lib/admin/validation-queue-mock"
import { cn } from "@/lib/utils"

type BoardState = {
  queue: ValidationQueueItem[]
  selectedId: string | null
}

function initBoard(): BoardState {
  const queue = createInitialValidationQueue()
  return { queue, selectedId: queue[0]?.id ?? null }
}

export function ValidationCenterBoard() {
  const [board, setBoard] = useState<BoardState>(initBoard)
  const { queue, selectedId } = board

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const selected = useMemo(
    () => queue.find((q) => q.id === selectedId) ?? null,
    [queue, selectedId]
  )

  const removeFromQueue = useCallback((id: string) => {
    setBoard((b) => {
      const queue = b.queue.filter((q) => q.id !== id)
      if (queue.length === 0) return { queue, selectedId: null }
      let selectedId = b.selectedId
      if (b.selectedId === id || !queue.some((q) => q.id === selectedId)) {
        selectedId = queue[0]!.id
      }
      return { queue, selectedId }
    })
  }, [])

  const handleValidate = () => {
    if (!selected) return
    const name = selected.learnerName
    removeFromQueue(selected.id)
    toast.success("Document validé", {
      description: `Le certificat / document final pour ${name} sera généré (simulation).`,
    })
    setRejectOpen(false)
    setRejectReason("")
  }

  const openReject = () => {
    setRejectReason("")
    setRejectOpen(true)
  }

  const confirmReject = () => {
    if (!selected) return
    const reason = rejectReason.trim()
    if (!reason) {
      toast.error("Indiquez un motif de rejet.")
      return
    }
    const name = selected.learnerName
    removeFromQueue(selected.id)
    toast.message("Document rejeté", {
      description: `${name} — « ${reason.slice(0, 80)}${reason.length > 80 ? "…" : ""} »`,
    })
    setRejectOpen(false)
    setRejectReason("")
  }

  const pendingCount = queue.length

  const pendingCertificates = useMemo(
    () => queue.filter((q) => q.kind === "certificate").length,
    [queue]
  )
  const pendingRecommendations = useMemo(
    () => queue.filter((q) => q.kind === "recommendation").length,
    [queue]
  )

  return (
    <div className="space-y-8">
      <ValidationCenterKpis
        pendingTotal={pendingCount}
        pendingCertificates={pendingCertificates}
        pendingRecommendations={pendingRecommendations}
      />

      <div className="grid min-h-0 gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] lg:items-stretch lg:min-h-[min(72vh,760px)]">
        <aside className={cn(ADMIN_DASHBOARD_CARD_CLASS, "flex min-h-0 flex-col")}>
          <header className="shrink-0 border-b border-neutral-200/60 pb-4">
            <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>File d’attente</h3>
            <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
              {pendingCount === 0
                ? "Aucun document en attente."
                : `${pendingCount} document${pendingCount > 1 ? "s" : ""} à traiter.`}
            </p>
          </header>
          {queue.length === 0 ? (
            <div className="mt-4 flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200/70 bg-white/40 px-4 py-10">
              <p className="text-sm text-neutral-500">La file est vide.</p>
            </div>
          ) : (
            <ul className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
              {queue.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setBoard((b) => ({ ...b, selectedId: item.id }))}
                    className={cn(
                      "flex w-full flex-col gap-1.5 rounded-xl border px-3 py-3 text-left transition-colors",
                      selectedId === item.id
                        ? "border-[#0D3570] bg-white shadow-sm ring-1 ring-[#0D3570]/15"
                        : "border-neutral-200/80 bg-white/80 hover:border-neutral-300 hover:bg-white"
                    )}
                  >
                    <span className="self-start">
                      <KindBadge kind={item.kind} />
                    </span>
                    <span className="truncate text-sm font-semibold text-[#0f172a]">{item.learnerName}</span>
                    <span className="truncate text-xs text-neutral-600">{item.formationLabel}</span>
                    <span className="text-[10px] text-neutral-400">
                      Soumis le{" "}
                      {new Date(item.submittedAtISO).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={cn(ADMIN_DASHBOARD_CARD_CLASS, "flex min-h-0 min-w-0 flex-col")}>
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-neutral-500">Sélectionnez un document dans la file d’attente.</p>
            </div>
          ) : (
            <>
              <header className="shrink-0 border-b border-neutral-200/60 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Visionneuse</h3>
                    <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
                      Aperçu du document soumis — aucun téléchargement requis.
                    </p>
                  </div>
                  <KindBadge kind={selected.kind} large />
                </div>
                <p className="mt-3 text-sm text-neutral-700">
                  <span className="font-medium text-[#0f172a]">{selected.learnerName}</span>
                  {" · "}
                  <span className="text-neutral-600">{selected.learnerEmail}</span>
                </p>
                <dl className="mt-4 grid gap-3 rounded-xl border border-neutral-200/80 bg-white px-4 py-3 text-sm shadow-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Type de formation suivie
                    </dt>
                    <dd className="mt-1 font-semibold leading-snug text-[#0f172a]">
                      {selected.formationTypeFollowed}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Score obtenu
                    </dt>
                    <dd className="mt-1 font-semibold tabular-nums text-[#0f172a]">
                      {formatScoreFr(selected.obtainedScore)} / {formatScoreFr(selected.maxScore)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Présence finale (séances)
                    </dt>
                    <dd className="mt-1 font-semibold tabular-nums text-[#0f172a]">
                      {selected.finalPresencePercent} %
                    </dd>
                  </div>
                </dl>
              </header>

              <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-xl border border-neutral-200/90 bg-neutral-100/80 p-4 shadow-inner">
                <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md">
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-8 py-10">
                    <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                      Aperçu (lecture seule)
                    </p>
                    <h4 className="mt-6 text-center font-serif text-lg font-bold uppercase tracking-wide text-[#0f172a]">
                      {selected.documentTitle}
                    </h4>
                    <div className="mt-8 space-y-4 text-sm leading-relaxed text-neutral-800">
                      {selected.paragraphs.map((p, i) => (
                        <p key={i} className="text-justify first-of-type:indent-0">
                          {p}
                        </p>
                      ))}
                    </div>
                    <div className="mt-12 flex justify-between border-t border-neutral-200 pt-6 text-xs text-neutral-500">
                      <span>Réf. {selected.id.toUpperCase()}</span>
                      <span>
                        {new Date(selected.submittedAtISO).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 shrink-0 flex flex-col gap-3 border-t border-neutral-200/60 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <p className="text-xs text-neutral-500">
                  La validation déclenche la génération du document final côté système (simulation).
                </p>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={openReject}
                  >
                    Rejeter
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#0D3570] hover:bg-[#0a2d5c]"
                    onClick={handleValidate}
                  >
                    Valider
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

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
              Ce message sera communiqué à {selected.learnerName} (simulation — pas d’envoi réel).
            </p>
            <Textarea
              className="mt-4 min-h-[120px] border-neutral-200 text-sm focus-visible:border-[#0D3570] focus-visible:ring-[#0D3570]/25"
              placeholder="Ex. : informations d’identité incomplètes, incohérence avec le dossier pédagogique…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
                Annuler
              </Button>
              <Button type="button" variant="destructive" onClick={confirmReject}>
                Confirmer le rejet
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatScoreFr(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
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
        large && "px-3 py-1 text-xs"
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", large && "size-4")} aria-hidden />
      {label}
    </span>
  )
}
