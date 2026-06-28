"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Settings2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import EnrollmentManageModal, {
  type EnrollmentTarget,
} from "@/components/platform/admin/apprenants/EnrollmentManageModal"
import {
  createEnrollment,
  fetchActiveEnrollments,
  fetchApprenantFilters,
  fetchEnrollments,
  fetchAvailableModules,
} from "@/lib/admin/apprenants-api"
import { cn } from "@/lib/utils"

interface InscriptionsColumnProps {
  onStudentSelect: (memberId: string) => void
}

type AddParcours = "ponctuelle" | "reconversion"

function resetTargetSelection(
  setAddKind: (v: "reconversion_pack" | "reconversion_module" | "ponctuelle_module") => void,
  setAddTargetRef: (v: string) => void,
  setAddTargetLabel: (v: string) => void,
  setTargetSearch: (v: string) => void,
) {
  setAddTargetRef("")
  setAddTargetLabel("")
  setTargetSearch("")
  setAddKind("ponctuelle_module")
}

type EnrollmentGroup = EnrollmentTarget & {
  key: string
  memberCount: number
  previewEmails: string[]
  avgAttendance: number
  totalSessions: number
}

export default function InscriptionsColumn({ onStudentSelect: _onStudentSelect }: InscriptionsColumnProps) {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [manageTarget, setManageTarget] = useState<EnrollmentTarget | null>(null)

  const [addEmail, setAddEmail] = useState("")
  const [addParcours, setAddParcours] = useState<AddParcours | null>(null)
  const [addKind, setAddKind] = useState<
    "reconversion_pack" | "reconversion_module" | "ponctuelle_module"
  >("ponctuelle_module")
  const [addTargetRef, setAddTargetRef] = useState("")
  const [addTargetLabel, setAddTargetLabel] = useState("")
  const [targetSearch, setTargetSearch] = useState("")

  const { data: enrollments = [], isLoading: enrollLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => fetchEnrollments(),
  })

  const { data: availableModules = [] } = useQuery({
    queryKey: ["available-modules"],
    queryFn: fetchAvailableModules,
    enabled: addOpen,
  })

  const { data: filtersPayload } = useQuery({
    queryKey: ["apprenant-filters"],
    queryFn: fetchApprenantFilters,
    enabled: addOpen,
  })

  useQuery({
    queryKey: ["active-enrollments"],
    queryFn: () => fetchActiveEnrollments(),
  })

  const ponctuelleModules = useMemo(
    () => availableModules.filter((m) => m.kind === "ponctuelle_module"),
    [availableModules],
  )

  const reconversionModules = useMemo(
    () => availableModules.filter((m) => m.kind === "reconversion_module"),
    [availableModules],
  )

  const reconversionPacks = filtersPayload?.reconversionPacks ?? []
  const reconversionTopics = filtersPayload?.reconversionTopics ?? []

  const topicLabelBySlug = useMemo(
    () => Object.fromEntries(reconversionTopics.map((t) => [t.id, t.label])),
    [reconversionTopics],
  )

  const filteredPonctuelleModules = useMemo(() => {
    const q = targetSearch.trim().toLowerCase()
    if (!q) return ponctuelleModules
    return ponctuelleModules.filter((m) => m.title.toLowerCase().includes(q))
  }, [ponctuelleModules, targetSearch])

  const filteredReconversionModules = useMemo(() => {
    const q = targetSearch.trim().toLowerCase()
    if (!q) return reconversionModules
    return reconversionModules.filter((m) => m.title.toLowerCase().includes(q))
  }, [reconversionModules, targetSearch])

  const filteredReconversionPacks = useMemo(() => {
    const q = targetSearch.trim().toLowerCase()
    if (!q) return reconversionPacks
    return reconversionPacks.filter((p) => {
      const topic = topicLabelBySlug[p.topicSlug] ?? p.topicSlug
      return p.label.toLowerCase().includes(q) || topic.toLowerCase().includes(q)
    })
  }, [reconversionPacks, targetSearch, topicLabelBySlug])

  const packsByTopic = useMemo(() => {
    const map = new Map<string, typeof reconversionPacks>()
    for (const pack of filteredReconversionPacks) {
      const key = pack.topicSlug
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(pack)
    }
    return map
  }, [filteredReconversionPacks])

  const closeAddForm = () => {
    setAddOpen(false)
    setAddEmail("")
    setAddParcours(null)
    setAddTargetRef("")
    setAddTargetLabel("")
    setTargetSearch("")
    setAddKind("ponctuelle_module")
  }

  const createMut = useMutation({
    mutationFn: () =>
      createEnrollment({
        email: addEmail.trim(),
        enrollmentKind: addKind,
        targetRef: addTargetRef,
        targetLabel: addTargetLabel,
      }),
    onSuccess: () => {
      toast.success("Inscription ajoutée.")
      void qc.invalidateQueries({ queryKey: ["enrollments"] })
      void qc.invalidateQueries({ queryKey: ["active-enrollments"] })
      closeAddForm()
    },
    onError: (e: Error) => toast.error(e.message || "Impossible d'ajouter l'inscription."),
  })

  const enrollmentGroups = useMemo((): EnrollmentGroup[] => {
    const map = new Map<string, EnrollmentGroup>()
    for (const e of enrollments) {
      const key = `${e.enrollmentKind}:${e.targetRef}`
      const existing = map.get(key)
      if (!existing) {
        map.set(key, {
          key,
          enrollmentKind: e.enrollmentKind,
          targetRef: e.targetRef,
          targetLabel: e.targetLabel,
          memberCount: 1,
          previewEmails: [e.email],
          avgAttendance: e.attendanceRate,
          totalSessions: e.sessionCount,
        })
      } else {
        existing.memberCount += 1
        if (existing.previewEmails.length < 3) existing.previewEmails.push(e.email)
        existing.avgAttendance = Math.round(
          (existing.avgAttendance * (existing.memberCount - 1) + e.attendanceRate) / existing.memberCount,
        )
        existing.totalSessions = Math.max(existing.totalSessions, e.sessionCount)
      }
    }
    return Array.from(map.values()).sort((a, b) => a.targetLabel.localeCompare(b.targetLabel, "fr"))
  }, [enrollments])

  const kindBadge = (kind: string) => {
    const isReconv = kind.startsWith("reconversion")
    const isPack = kind === "reconversion_pack"
    return (
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          isPack
            ? "bg-violet-200 text-violet-900 ring-1 ring-violet-300/80"
            : isReconv
              ? "bg-violet-100 text-violet-800 ring-1 ring-violet-200/80"
              : "bg-sky-100 text-sky-800 ring-1 ring-sky-200/80",
        )}
      >
        {isPack ? "Pack" : isReconv ? "Reconversion" : "Ponctuelle"}
      </span>
    )
  }

  const selectTarget = (
    kind: typeof addKind,
    ref: string,
    label: string,
  ) => {
    setAddKind(kind)
    setAddTargetRef(ref)
    setAddTargetLabel(label)
    setTargetSearch("")
  }

  const parcoursBtn = (id: AddParcours, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        setAddParcours(id)
        resetTargetSelection(setAddKind, setAddTargetRef, setAddTargetLabel, setTargetSearch)
        if (id === "ponctuelle") setAddKind("ponctuelle_module")
      }}
      className={cn(
        "flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors",
        addParcours === id
          ? id === "ponctuelle"
            ? "border-sky-500 bg-sky-50 text-sky-900"
            : "border-violet-500 bg-violet-50 text-violet-900"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
      )}
    >
      {label}
    </button>
  )

  const renderTargetList = () => {
    if (!addParcours) return null

    if (addTargetRef) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-[#008080]/30 bg-[#008080]/5 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-900">{addTargetLabel}</p>
            <p className="text-xs text-neutral-500">
              {addKind === "reconversion_pack"
                ? "Pack reconversion"
                : addKind === "reconversion_module"
                  ? "Module reconversion"
                  : "Module ponctuel"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => resetTargetSelection(setAddKind, setAddTargetRef, setAddTargetLabel, setTargetSearch)}
            className="shrink-0 text-neutral-400 hover:text-neutral-700"
            aria-label="Changer la sélection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <input
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-[#008080] focus:ring-2"
          value={targetSearch}
          onChange={(e) => setTargetSearch(e.target.value)}
          placeholder={
            addParcours === "ponctuelle"
              ? "Rechercher un module ponctuel…"
              : "Rechercher un pack ou module reconversion…"
          }
        />
        <div className="max-h-52 overflow-y-auto rounded-lg border border-neutral-200 bg-white">
          {addParcours === "ponctuelle" ? (
            filteredPonctuelleModules.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-neutral-500">Aucun module ponctuel trouvé.</p>
            ) : (
              <ul>
                {filteredPonctuelleModules.map((m) => (
                  <li key={m.ref}>
                    <button
                      type="button"
                      className="flex w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50"
                      onClick={() => selectTarget("ponctuelle_module", m.ref, m.title)}
                    >
                      <span className="font-medium text-neutral-900">{m.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="divide-y divide-neutral-100">
              {filteredReconversionPacks.length > 0 ? (
                <div className="p-2">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                    Packs reconversion
                  </p>
                  {Array.from(packsByTopic.entries()).map(([topicSlug, packs]) => (
                    <div key={topicSlug} className="mb-2">
                      <p className="px-2 py-1 text-xs font-medium text-neutral-500">
                        {topicLabelBySlug[topicSlug] ?? topicSlug}
                      </p>
                      <ul>
                        {packs.map((pack) => (
                          <li key={pack.id}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-violet-50"
                              onClick={() =>
                                selectTarget(
                                  "reconversion_pack",
                                  pack.id,
                                  `${pack.label}${topicLabelBySlug[pack.topicSlug] ? ` — ${topicLabelBySlug[pack.topicSlug]}` : ""}`,
                                )
                              }
                            >
                              <span className="font-medium text-neutral-900">{pack.label}</span>
                              <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                                Pack
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
              {filteredReconversionModules.length > 0 ? (
                <div className="p-2">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                    Modules reconversion
                  </p>
                  <ul>
                    {filteredReconversionModules.map((m) => (
                      <li key={m.ref}>
                        <button
                          type="button"
                          className="flex w-full px-3 py-2.5 text-left text-sm hover:bg-violet-50/80"
                          onClick={() => selectTarget("reconversion_module", m.ref, m.title)}
                        >
                          <span className="font-medium text-neutral-900">{m.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {filteredReconversionPacks.length === 0 && filteredReconversionModules.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-neutral-500">
                  Aucun pack ni module reconversion trouvé.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-neutral-900">Inscriptions actives</h2>
        <Button
          type="button"
          size="sm"
          className="shrink-0 gap-1 bg-[#008080] text-white hover:bg-[#006d6d]"
          onClick={() => {
            if (addOpen) closeAddForm()
            else setAddOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Ajouter une inscription
        </Button>
      </div>

      {addOpen ? (
        <div className="mb-4 space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Nouvelle inscription
          </p>

          <div className="flex gap-2">
            {parcoursBtn("ponctuelle", "Ponctuelle")}
            {parcoursBtn("reconversion", "Reconversion")}
          </div>

          {addParcours ? (
            <>
              <label className="grid gap-1 text-sm">
                <span className="text-neutral-600">E-mail de l&apos;apprenant</span>
                <input
                  type="email"
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-[#008080] focus:ring-2"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="apprenant@exemple.com"
                />
              </label>

              <label className="grid gap-1.5 text-sm">
                <span className="text-neutral-600">
                  {addParcours === "ponctuelle"
                    ? "Choisir un module ponctuel"
                    : "Choisir un pack ou un module reconversion"}
                </span>
                {renderTargetList()}
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={closeAddForm}>
                  Annuler
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#008080] text-white hover:bg-[#006d6d]"
                  disabled={createMut.isPending || !addEmail.trim() || !addTargetRef}
                  onClick={() => {
                    if (!addEmail.trim()) {
                      toast.error("Saisissez un e-mail.")
                      return
                    }
                    if (!addTargetRef) {
                      toast.error("Sélectionnez un module ou un pack.")
                      return
                    }
                    createMut.mutate()
                  }}
                >
                  {createMut.isPending ? "Ajout…" : "Ajouter"}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-500">
              Choisissez d&apos;abord <strong>Ponctuelle</strong> ou <strong>Reconversion</strong>.
            </p>
          )}
        </div>
      ) : null}

      {enrollLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-200" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-neutral-200" />
                <div className="h-3 w-2/3 rounded bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      ) : enrollmentGroups.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          Aucune inscription active.{" "}
          <button type="button" className="text-[#008080] underline" onClick={() => setAddOpen(true)}>
            Ajouter la première
          </button>
        </p>
      ) : (
        <ul className="space-y-2">
          {enrollmentGroups.map((g) => (
            <li key={g.key}>
              <div className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-neutral-50/80 px-3 py-3 transition-colors hover:border-neutral-200 hover:bg-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#008080]/10 text-sm font-semibold text-[#006d6d]">
                  {g.memberCount}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {kindBadge(g.enrollmentKind)}
                    <span className="text-xs font-medium text-neutral-500">
                      {g.memberCount} inscrit{g.memberCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-medium text-neutral-900">{g.targetLabel}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {g.previewEmails.join(", ")}
                    {g.memberCount > g.previewEmails.length ? "…" : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    jusqu&apos;à {g.totalSessions} séance{g.totalSessions !== 1 ? "s" : ""} · ~{g.avgAttendance}%
                    présence
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1 border-[#008080]/30 text-[#006d6d] hover:bg-[#008080]/5"
                  onClick={() =>
                    setManageTarget({
                      enrollmentKind: g.enrollmentKind,
                      targetRef: g.targetRef,
                      targetLabel: g.targetLabel,
                    })
                  }
                >
                  <Settings2 className="h-4 w-4" />
                  Gérer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {manageTarget ? (
        <EnrollmentManageModal target={manageTarget} onClose={() => setManageTarget(null)} />
      ) : null}
    </section>
  )
}
