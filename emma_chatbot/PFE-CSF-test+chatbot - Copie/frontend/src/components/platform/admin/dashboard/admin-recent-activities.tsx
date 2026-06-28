"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowRight, Bot, FileDown, Shield, UserCog, X } from "lucide-react"
import { toast } from "sonner"
import {
  ADMIN_DASHBOARD_CARD_CLASS,
  ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS,
  ADMIN_DASHBOARD_CARD_TITLE_CLASS,
} from "@/lib/admin/dashboard-card-styles"
import type { AdminAuditActor, AdminAuditEntry } from "@/lib/admin/dashboard-mock-data"
import { RECENT_ACTIVITIES } from "@/lib/admin/dashboard-mock-data"
import { cn } from "@/lib/utils"

const MAX_VISIBLE = 4

const CSV_SEP = ";"

const ACTOR_ROLE_LABEL: Record<AdminAuditActor, string> = {
  admin: "Administrateur",
  assistant: "Assistante",
  system: "Système",
}

function escapeCsvCell(value: string): string {
  if (value.includes(CSV_SEP) || value.includes('"') || /[\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function exportActivitiesCsv(entries: AdminAuditEntry[]) {
  const headers = ["Horodatage", "Profil affiché", "Rôle", "Action", "Détail"]
  const lines = [
    headers.map(escapeCsvCell).join(CSV_SEP),
    ...entries.map((e) =>
      [e.at, e.actorDisplay, ACTOR_ROLE_LABEL[e.actor], e.action, e.detail ?? ""]
        .map(escapeCsvCell)
        .join(CSV_SEP)
    ),
  ]
  const bom = "\uFEFF"
  const content = bom + lines.join("\r\n")
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `activites-recentes-csf-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function ActorIcon({ actor }: { actor: AdminAuditActor }) {
  if (actor === "admin") return <Shield className="h-4 w-4" aria-hidden />
  if (actor === "assistant") return <UserCog className="h-4 w-4" aria-hidden />
  return <Bot className="h-4 w-4" aria-hidden />
}

function ActorBadge({ actor }: { actor: AdminAuditActor }) {
  const styles: Record<AdminAuditActor, string> = {
    admin: "bg-[#0D3570]/12 text-[#0D3570] ring-[#0D3570]/20",
    assistant: "bg-emerald-100/80 text-emerald-900 ring-emerald-600/15",
    system: "bg-neutral-200/80 text-neutral-700 ring-neutral-400/20",
  }
  const labels: Record<AdminAuditActor, string> = {
    admin: "Admin",
    assistant: "Assistante",
    system: "Système",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
        styles[actor]
      )}
    >
      <ActorIcon actor={actor} />
      {labels[actor]}
    </span>
  )
}

const FILTER_OPTIONS: { id: AdminAuditActor | "all"; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "admin", label: "Admin" },
  { id: "assistant", label: "Assistante" },
  { id: "system", label: "Système" },
]

function ActorFilterBar({
  filter,
  setFilter,
}: {
  filter: AdminAuditActor | "all"
  setFilter: (value: AdminAuditActor | "all") => void
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((opt) => {
        const active = filter === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFilter(opt.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-[#0D3570] text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function ActivityRow({
  entry,
  isSidebar,
}: {
  entry: AdminAuditEntry
  isSidebar: boolean
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-4 transition-colors",
        isSidebar ? "py-3" : "py-3.5"
      )}
    >
      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
        <ActorBadge actor={entry.actor} />
        <span className={cn("text-neutral-400", isSidebar ? "text-[9px]" : "text-[10px]")}>
          {entry.at}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium text-[#0f172a]", isSidebar ? "text-[11px] leading-snug" : "text-sm")}>
          {entry.action}
        </p>
        {entry.detail ? (
          <p className={cn("text-neutral-600", isSidebar ? "text-[10px] leading-snug" : "mt-1 text-xs")}>
            {entry.detail}
          </p>
        ) : null}
      </div>
      <p
        className={cn("shrink-0 text-neutral-500 sm:text-right", isSidebar ? "text-[10px]" : "text-xs")}
      >
        {entry.actorDisplay}
      </p>
    </li>
  )
}

export function AdminRecentActivities({
  variant = "default",
  data,
}: {
  variant?: "default" | "sidebar"
  data?: AdminAuditEntry[] | null
}) {
  const isSidebar = variant === "sidebar"
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState<AdminAuditActor | "all">("all")
  const [secondsAgo, setSecondsAgo] = useState(0)
  // Ne pas remplacer une liste vide API par les données fictiques (sinon le vrai journal est masqué).
  const allActivities = Array.isArray(data) ? data : RECENT_ACTIVITIES

  const filtered =
    filter === "all" ? allActivities : allActivities.filter((e) => e.actor === filter)

  const handleExportCsv = useCallback(() => {
    try {
      exportActivitiesCsv(allActivities)
      toast.success("Fichier CSV téléchargé.")
    } catch {
      toast.error("Impossible d'exporter le journal.")
    }
  }, [allActivities])

  const visible = filtered.slice(0, MAX_VISIBLE)
  const hasMore = filtered.length > MAX_VISIBLE

  useEffect(() => {
    setSecondsAgo(0)
  }, [data])

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsAgo((s) => s + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [modalOpen])

  return (
    <section aria-labelledby="admin-audit-heading" className={isSidebar ? "" : undefined}>
      <div className={ADMIN_DASHBOARD_CARD_CLASS}>
        <header className="border-b border-neutral-200/60 pb-4">
          <h2 id="admin-audit-heading" className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>
            Activités récentes
          </h2>
          <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
            {isSidebar
              ? "Journal partagé — qui a fait quoi."
              : "Journal partagé (admin / assistante). À terme : traçabilité serveur et filtrage selon les droits."}
          </p>
        </header>
        {data != null ? (
          <div className="mb-3 flex items-center gap-1.5 text-[11px] text-emerald-600">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {secondsAgo < 5 ? "À jour" : `Mis à jour il y a ${secondsAgo} s`} · Actualisation auto
          </div>
        ) : null}
        <ActorFilterBar filter={filter} setFilter={setFilter} />
        <ul
          className={cn(
            "mt-4 divide-y divide-neutral-200/70",
            isSidebar && "max-h-[min(520px,62vh)] overflow-y-auto pr-0.5"
          )}
        >
          {visible.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} isSidebar={isSidebar} />
          ))}
        </ul>

        {hasMore ? (
          <div className="mt-4 border-t border-neutral-200/60 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5d7cae] transition-colors hover:text-[#0D3570] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3570]/25"
            >
              Voir tout l&apos;historique
              <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-audit-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200/80 px-5 py-4">
              <h3 id="admin-audit-modal-title" className="text-base font-semibold text-[#0f172a]">
                Historique complet
              </h3>
              <button
                type="button"
                className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Fermer"
                onClick={() => setModalOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="px-5 pt-3">
              <ActorFilterBar filter={filter} setFilter={setFilter} />
            </div>
            <ul className="divide-y divide-neutral-200/70 overflow-y-auto px-5 py-2">
              {filtered.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} isSidebar={false} />
              ))}
            </ul>
            <div className="flex flex-col-reverse gap-2 border-t border-neutral-200/80 px-5 py-3 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-[#0f172a] transition-colors hover:bg-neutral-50 sm:w-auto"
                onClick={handleExportCsv}
              >
                <FileDown className="size-4 shrink-0" aria-hidden />
                Exporter (CSV)
              </button>
              <button
                type="button"
                className="w-full rounded-lg bg-[#0D3570] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0a2d5c] sm:w-auto sm:min-w-[7rem]"
                onClick={() => setModalOpen(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
