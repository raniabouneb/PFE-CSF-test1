"use client"

import Link from "next/link"
import { Lock, BookOpen, CheckCircle2 } from "lucide-react"
import { useFormations } from "@/lib/hooks"
import type { Formation, ModuleProgression, PackModuleProgression } from "@/types/learner"

export default function FormationsContent() {
  const { data: list = [], isLoading, isError, refetch } = useFormations()

  const ponctuelleEnrollments = list.filter((e) => e.type === "ponctuelle")
  const reconversionEnrollments = list.filter((e) => e.type === "reconversion")

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-[#1a2a3a]">Mes Formations</h2>
            {!isLoading && (
              <span className="rounded-full bg-[#ccfbf1] px-3 py-1 text-xs font-semibold text-[#0f766e] ring-1 ring-teal-200/60">
                {list.length} formation{list.length > 1 ? "s" : ""} inscrite{list.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Retrouvez vos parcours, suivez votre progression module par module et accédez aux ressources associées.
          </p>
        </div>
      </div>

      {/* Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200 p-6">
              <div className="mb-4 flex gap-2">
                <div className="h-4 w-32 rounded bg-neutral-200" />
                <div className="h-4 w-16 rounded-full bg-neutral-200" />
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="h-3 w-24 rounded bg-neutral-200 mb-2" />
                <div className="h-2.5 w-full rounded-full bg-neutral-200" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="rounded-xl border border-gray-200 p-3">
                    <div className="h-20 rounded bg-neutral-200 mb-2" />
                    <div className="h-3 w-2/3 rounded bg-neutral-200" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 py-12 text-center">
          <p className="mb-3 text-sm text-red-700">Impossible de charger vos formations.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <p className="text-sm text-neutral-500">Aucune formation inscrite pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {ponctuelleEnrollments.map((enrollment) => (
            <PonctuelleCard key={enrollment.enrollment_id} enrollment={enrollment} />
          ))}
          {reconversionEnrollments.map((enrollment) => (
            <ReconversionCard key={enrollment.enrollment_id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProgressBar({ percent, color = "amber" }: { percent: number; color?: "amber" | "blue" | "green" }) {
  const barColors = {
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    green: "bg-emerald-500",
  }
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${barColors[color]}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-[#1a2a3a]">{percent}%</span>
    </div>
  )
}

function PonctuelleCard({ enrollment }: { enrollment: Formation }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
      <div className="mb-1 flex items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">{enrollment.groupe_nom}</p>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
          ponctuelle
        </span>
        {enrollment.progress_percent >= 100 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Terminé
          </span>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-slate-50/90 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Avancement global</p>
        <ProgressBar percent={enrollment.progress_percent} color="amber" />
      </div>

      {enrollment.modules.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollment.modules.map((mod) => (
            <PonctuelleModuleCard
              key={mod.module_id}
              module={mod}
              enrollmentId={enrollment.enrollment_id}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function PonctuelleModuleCard({
  module,
  enrollmentId,
}: {
  module: ModuleProgression
  enrollmentId: string
}) {
  const href = `/dashboard/formations/${enrollmentId}/modules/${module.module_id}`
  const isComplete = module.progress_percent >= 100

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-[#1a3d5d]/35 hover:shadow-md"
    >
      <div className="h-24 bg-gradient-to-br from-[#0d9488]/30 to-[#1e40af]/40" />
      <div className="p-3">
        <p className="text-sm font-semibold leading-snug text-[#1a2a3a]">{module.titre}</p>
        <div className="mt-2">
          <ProgressBar percent={module.progress_percent} color={isComplete ? "green" : "blue"} />
        </div>
        {isComplete ? (
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Terminé
          </span>
        ) : (
          <p className="mt-1 text-xs text-neutral-500">
            {module.minutes_validees} / {module.duree_minutes ?? "?"} min
          </p>
        )}
      </div>
    </Link>
  )
}

function ReconversionCard({ enrollment }: { enrollment: Formation }) {
  const sorted = [...enrollment.pack_modules].sort((a, b) => a.ordre - b.ordre)
  const doneCount = sorted.filter((m) => m.statut === "done").length

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
      <div className="mb-1 flex items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">{enrollment.groupe_nom}</p>
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
          reconversion
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-slate-50/90 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Avancement global
          </p>
          <p className="text-xs text-neutral-500">
            {doneCount} / {sorted.length} module{sorted.length > 1 ? "s" : ""} terminé{doneCount > 1 ? "s" : ""}
          </p>
        </div>
        <div className="mt-2">
          <ProgressBar percent={enrollment.progress_percent} color="green" />
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {sorted.map((mod, idx) => (
          <ReconversionModuleRow
            key={mod.module_id}
            module={mod}
            index={idx + 1}
            enrollmentId={enrollment.enrollment_id}
          />
        ))}
      </div>
    </section>
  )
}

function ReconversionModuleRow({
  module,
  index,
  enrollmentId,
}: {
  module: PackModuleProgression
  index: number
  enrollmentId: string
}) {
  const isLocked = module.statut === "locked"
  const isOpen = module.statut === "open"
  const isDone = module.statut === "done"
  const href = `/dashboard/formations/${enrollmentId}/modules/${module.module_id}`

  const statusBadge = isLocked ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80">
      <Lock className="h-3 w-3" />
      Verrouillé
    </span>
  ) : isOpen ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200/80">
      <BookOpen className="h-3 w-3" />
      En cours
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
      <CheckCircle2 className="h-3 w-3" />
      Terminé
    </span>
  )

  const content = (
    <div
      className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition ${
        isLocked
          ? "cursor-not-allowed border-gray-200 bg-gray-50/50 opacity-60"
          : "border-gray-200 bg-white hover:border-[#1a3d5d]/35 hover:shadow-sm"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D3570] text-xs font-bold text-white">
        {index}
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium text-[#1a2a3a]">{module.titre}</p>
      {statusBadge}
    </div>
  )

  if (isLocked) return content

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}
