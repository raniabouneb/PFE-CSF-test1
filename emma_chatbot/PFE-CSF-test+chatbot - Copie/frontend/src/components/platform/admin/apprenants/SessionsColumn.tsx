"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  addMemberToModuleSession,
  createModuleSession,
  fetchApprenantFilters,
  fetchAvailableModules,
  fetchEnrolledMembersForTarget,
  fetchModuleSessions,
  fetchPackModules,
  type EnrolledMemberForTarget,
  type ModuleSessionCreateBody,
  type ModuleSessionSummary,
  type PackModuleOption,
} from "@/lib/admin/apprenants-api"
import { cn } from "@/lib/utils"

interface SessionsColumnProps {
  onManage: (session: ModuleSessionSummary) => void
}

type SessionTarget = {
  enrollmentKind: "ponctuelle_module" | "reconversion_module" | "reconversion_pack"
  accessKind: "ponctuelle_module" | "reconversion_module" | "reconversion_pack"
  ref: string
  label: string
}

function accessKindLabel(kind: string): string {
  if (kind === "reconversion_pack") return "Pack"
  if (kind === "reconversion_module") return "Reconversion"
  return "Ponctuelle"
}

export default function SessionsColumn({ onManage }: SessionsColumnProps) {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [sessionLabel, setSessionLabel] = useState("")
  const [ponctuelleSearch, setPonctuelleSearch] = useState("")
  const [reconversionSearch, setReconversionSearch] = useState("")
  const [selectedPonctuelle, setSelectedPonctuelle] = useState<SessionTarget | null>(null)
  const [selectedReconversion, setSelectedReconversion] = useState<SessionTarget | null>(null)
  const [selectedPackModule, setSelectedPackModule] = useState<PackModuleOption | null>(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["module-sessions"],
    queryFn: fetchModuleSessions,
  })
  const visibleSessions = useMemo(
    () =>
      sessions.filter(
        (s) => !s.sessionLabel.trim().toLowerCase().startsWith("inscription"),
      ),
    [sessions],
  )

  const { data: availableModules = [] } = useQuery({
    queryKey: ["available-modules"],
    queryFn: fetchAvailableModules,
    enabled: formOpen,
  })

  const { data: filtersPayload } = useQuery({
    queryKey: ["apprenant-filters"],
    queryFn: fetchApprenantFilters,
    enabled: formOpen,
  })

  const { data: ponctuelleEnrolled = [] } = useQuery<EnrolledMemberForTarget[]>({
    queryKey: ["enrolled-members-for-target", "ponctuelle", selectedPonctuelle?.ref],
    queryFn: () =>
      fetchEnrolledMembersForTarget("ponctuelle_module", selectedPonctuelle!.ref),
    enabled: !!selectedPonctuelle,
  })

  const packIdForModules =
    selectedReconversion?.accessKind === "reconversion_pack" ? selectedReconversion.ref : null

  const { data: packModules = [] } = useQuery({
    queryKey: ["pack-modules", packIdForModules],
    queryFn: () => fetchPackModules(packIdForModules!),
    enabled: !!packIdForModules,
  })

  const { data: reconversionEnrolled = [] } = useQuery<EnrolledMemberForTarget[]>({
    queryKey: [
      "enrolled-members-for-target",
      selectedReconversion?.enrollmentKind,
      selectedReconversion?.ref,
    ],
    queryFn: () =>
      fetchEnrolledMembersForTarget(
        selectedReconversion!.enrollmentKind,
        selectedReconversion!.ref,
      ),
    enabled: !!selectedReconversion,
  })

  const enrolledMembers = useMemo(() => {
    const byEmail = new Map<string, EnrolledMemberForTarget>()
    for (const m of [...ponctuelleEnrolled, ...reconversionEnrolled]) {
      if (!byEmail.has(m.emailNormalized)) byEmail.set(m.emailNormalized, m)
    }
    return Array.from(byEmail.values())
  }, [ponctuelleEnrolled, reconversionEnrolled])

  const hasSelection = !!(selectedPonctuelle || selectedReconversion)

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
    const q = ponctuelleSearch.trim().toLowerCase()
    if (!q) return ponctuelleModules
    return ponctuelleModules.filter((m) => m.title.toLowerCase().includes(q))
  }, [ponctuelleModules, ponctuelleSearch])

  const filteredReconversionModules = useMemo(() => {
    const q = reconversionSearch.trim().toLowerCase()
    if (!q) return reconversionModules
    return reconversionModules.filter((m) => m.title.toLowerCase().includes(q))
  }, [reconversionModules, reconversionSearch])

  const filteredReconversionPacks = useMemo(() => {
    const q = reconversionSearch.trim().toLowerCase()
    if (!q) return reconversionPacks
    return reconversionPacks.filter((p) => {
      const topic = topicLabelBySlug[p.topicSlug] ?? p.topicSlug
      return p.label.toLowerCase().includes(q) || topic.toLowerCase().includes(q)
    })
  }, [reconversionPacks, reconversionSearch, topicLabelBySlug])

  const packsByTopic = useMemo(() => {
    const map = new Map<string, typeof reconversionPacks>()
    for (const pack of filteredReconversionPacks) {
      const key = pack.topicSlug
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(pack)
    }
    return map
  }, [filteredReconversionPacks])

  const resetForm = () => {
    setFormOpen(false)
    setSessionLabel("")
    setPonctuelleSearch("")
    setReconversionSearch("")
    setSelectedPonctuelle(null)
    setSelectedReconversion(null)
    setSelectedPackModule(null)
    setSelectedMemberIds(new Set())
    setSelectAll(false)
  }

  const clearMembersSelection = () => {
    setSelectedMemberIds(new Set())
    setSelectAll(false)
  }

  const buildPayload = (): ModuleSessionCreateBody => {
    const modules = [
      ...(selectedPonctuelle
        ? [
            {
              moduleRef: selectedPonctuelle.ref,
              moduleLabel: selectedPonctuelle.label,
              accessKind: selectedPonctuelle.accessKind,
            },
          ]
        : []),
      ...(selectedReconversion
        ? [
            {
              moduleRef: selectedReconversion.ref,
              moduleLabel: selectedReconversion.label,
              accessKind: selectedReconversion.accessKind,
            },
          ]
        : []),
    ]
    const defaultLabel = modules.map((m) => m.moduleLabel).join(" + ")
    const packModuleRef =
      selectedReconversion?.accessKind === "reconversion_pack"
        ? selectedPackModule?.targetRef ?? null
        : selectedReconversion?.accessKind === "reconversion_module"
          ? selectedReconversion.ref
          : selectedPonctuelle?.ref ?? null
    return {
      sessionLabel: sessionLabel.trim() || defaultLabel,
      modules,
      packSessionModuleRef: packModuleRef,
    }
  }

  const createMut = useMutation({
    mutationFn: async () => {
      const created = await createModuleSession(buildPayload())
      if (selectedMemberIds.size > 0) {
        const emailsToAdd = enrolledMembers
          .filter((m) => selectedMemberIds.has(m.emailNormalized))
          .map((m) => m.email)
        for (const email of emailsToAdd) {
          try {
            await addMemberToModuleSession(created.groupId, email)
          } catch {
            // membre déjà présent ou erreur individuelle
          }
        }
      }
      return created
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["module-sessions"] })
      void qc.invalidateQueries({ queryKey: ["active-enrollments"] })
      void qc.invalidateQueries({ queryKey: ["enrollments"] })
      toast.success("Session-module créée.")
      resetForm()
    },
    onError: (e: Error) => {
      toast.error(e.message || "Création impossible.")
    },
  })

  const targetChip = (target: SessionTarget, onClear: () => void, color: "sky" | "violet") => (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
        color === "sky" ? "bg-sky-100 text-sky-800" : "bg-violet-100 text-violet-800",
      )}
    >
      {accessKindLabel(target.accessKind)} · {target.label}
      <button type="button" onClick={onClear} className="ml-0.5 hover:opacity-70" aria-label="Retirer">
        ×
      </button>
    </span>
  )

  const renderMemberPicker = () => {
    if (!hasSelection) return null

    if (enrolledMembers.length === 0) {
      return (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Aucun apprenant inscrit aux modules/packs sélectionnés. Ajoutez des inscriptions dans «
          Inscriptions actives ».
        </p>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700">
            Apprenants inscrits ({enrolledMembers.length})
          </p>
          <button
            type="button"
            className="text-xs text-[#008080] hover:underline"
            onClick={() => {
              if (selectAll) {
                setSelectedMemberIds(new Set())
                setSelectAll(false)
              } else {
                setSelectedMemberIds(new Set(enrolledMembers.map((m) => m.emailNormalized)))
                setSelectAll(true)
              }
            }}
          >
            {selectAll ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          Union des inscrits au module ponctuel et/ou au pack-module reconversion sélectionnés.
        </p>
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-2">
          {enrolledMembers.map((m) => {
            const checked = selectedMemberIds.has(m.emailNormalized)
            return (
              <li key={m.enrollmentId + m.emailNormalized}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-[#008080] accent-[#008080]"
                    checked={checked}
                    onChange={() => {
                      setSelectedMemberIds((prev) => {
                        const next = new Set(prev)
                        if (checked) next.delete(m.emailNormalized)
                        else next.add(m.emailNormalized)
                        setSelectAll(next.size === enrolledMembers.length)
                        return next
                      })
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">{m.fullName}</p>
                    <p className="text-xs text-neutral-500">{m.email}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-neutral-600">
                    {m.attendanceRate}%
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
        {selectedMemberIds.size > 0 ? (
          <p className="text-xs font-medium text-[#008080]">
            {selectedMemberIds.size} apprenant{selectedMemberIds.size > 1 ? "s" : ""} sélectionné
            {selectedMemberIds.size > 1 ? "s" : ""}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-neutral-900">Sessions-modules</h2>
        <Button
          type="button"
          size="sm"
          className="shrink-0 gap-1 bg-[#008080] text-white hover:bg-[#006d6d]"
          onClick={() => {
            if (formOpen) resetForm()
            else setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nouvelle session
        </Button>
      </div>

      {formOpen ? (
        <div className="mb-4 space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Nouvelle session-module
          </p>
          <p className="text-sm text-neutral-600">
            Vous pouvez combiner un <strong>module ponctuel</strong> et un{" "}
            <strong>pack ou module reconversion</strong> dans la même session.
          </p>

          <label className="grid gap-1 text-sm">
            <span className="text-neutral-600">
              Nom de la session <span className="text-neutral-400">(optionnel)</span>
            </span>
            <input
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-[#008080] focus:ring-2"
              value={sessionLabel}
              onChange={(e) => setSessionLabel(e.target.value)}
              placeholder="Ex. Anglais + Pack IA — Printemps 2025"
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Ponctuelle */}
            <div className="space-y-2 rounded-lg border border-sky-100 bg-white p-3">
              <p className="text-sm font-medium text-sky-900">Module ponctuel</p>
              {selectedPonctuelle ? (
                <div className="flex flex-wrap gap-1">
                  {targetChip(selectedPonctuelle, () => {
                    setSelectedPonctuelle(null)
                    clearMembersSelection()
                  }, "sky")}
                </div>
              ) : (
                <>
                  <input
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-sky-400 focus:ring-2"
                    value={ponctuelleSearch}
                    onChange={(e) => setPonctuelleSearch(e.target.value)}
                    placeholder="Rechercher un module ponctuel…"
                  />
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200">
                    {filteredPonctuelleModules.length === 0 ? (
                      <p className="px-3 py-3 text-center text-xs text-neutral-500">Aucun module.</p>
                    ) : (
                      <ul>
                        {filteredPonctuelleModules.map((m) => (
                          <li key={m.ref}>
                            <button
                              type="button"
                              className="flex w-full px-3 py-2 text-left text-sm hover:bg-sky-50"
                              onClick={() => {
                                setSelectedPonctuelle({
                                  enrollmentKind: "ponctuelle_module",
                                  accessKind: "ponctuelle_module",
                                  ref: m.ref,
                                  label: m.title,
                                })
                                setPonctuelleSearch("")
                                clearMembersSelection()
                              }}
                            >
                              {m.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Reconversion */}
            <div className="space-y-2 rounded-lg border border-violet-100 bg-white p-3">
              <p className="text-sm font-medium text-violet-900">Pack ou module reconversion</p>
              {selectedReconversion ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {targetChip(selectedReconversion, () => {
                      setSelectedReconversion(null)
                      setSelectedPackModule(null)
                      clearMembersSelection()
                    }, "violet")}
                  </div>
                  {selectedReconversion.accessKind === "reconversion_pack" ? (
                    <div>
                      <p className="mb-1 text-xs font-medium text-violet-800">
                        Module du pack pour cette session
                      </p>
                      {packModules.length === 0 ? (
                        <p className="text-xs text-neutral-500">Chargement des modules…</p>
                      ) : (
                        <select
                          className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                          value={selectedPackModule?.targetRef ?? ""}
                          onChange={(e) => {
                            const mod = packModules.find((m) => m.targetRef === e.target.value)
                            setSelectedPackModule(mod ?? null)
                            clearMembersSelection()
                          }}
                        >
                          <option value="">— Choisir le module —</option>
                          {packModules.map((m) => (
                            <option key={m.targetRef} value={m.targetRef}>
                              {m.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <input
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                    value={reconversionSearch}
                    onChange={(e) => setReconversionSearch(e.target.value)}
                    placeholder="Rechercher un pack ou module…"
                  />
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200">
                    {filteredReconversionPacks.length === 0 &&
                    filteredReconversionModules.length === 0 ? (
                      <p className="px-3 py-3 text-center text-xs text-neutral-500">Aucun élément.</p>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {filteredReconversionPacks.length > 0 ? (
                          <div className="p-1">
                            <p className="px-2 py-1 text-[10px] font-semibold uppercase text-violet-700">
                              Packs
                            </p>
                            {Array.from(packsByTopic.entries()).map(([topicSlug, packs]) => (
                              <div key={topicSlug}>
                                <p className="px-2 text-[10px] text-neutral-500">
                                  {topicLabelBySlug[topicSlug] ?? topicSlug}
                                </p>
                                <ul>
                                  {packs.map((pack) => (
                                    <li key={pack.id}>
                                      <button
                                        type="button"
                                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-violet-50"
                                        onClick={() => {
                                          setSelectedReconversion({
                                            enrollmentKind: "reconversion_pack",
                                            accessKind: "reconversion_pack",
                                            ref: pack.id,
                                            label: `${pack.label}${topicLabelBySlug[pack.topicSlug] ? ` — ${topicLabelBySlug[pack.topicSlug]}` : ""}`,
                                          })
                                          setSelectedPackModule(null)
                                          setReconversionSearch("")
                                          clearMembersSelection()
                                        }}
                                      >
                                        <span>{pack.label}</span>
                                        <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800">
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
                          <div className="p-1">
                            <p className="px-2 py-1 text-[10px] font-semibold uppercase text-violet-700">
                              Modules
                            </p>
                            <ul>
                              {filteredReconversionModules.map((m) => (
                                <li key={m.ref}>
                                  <button
                                    type="button"
                                    className="flex w-full px-3 py-2 text-left text-sm hover:bg-violet-50"
                                    onClick={() => {
                                      setSelectedReconversion({
                                        enrollmentKind: "reconversion_module",
                                        accessKind: "reconversion_module",
                                        ref: m.ref,
                                        label: m.title,
                                      })
                                      setReconversionSearch("")
                                      clearMembersSelection()
                                    }}
                                  >
                                    {m.title}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {renderMemberPicker()}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#008080] text-white hover:bg-[#006d6d]"
              disabled={createMut.isPending || !hasSelection}
              onClick={() => {
                if (!hasSelection) {
                  toast.error("Sélectionnez au moins un module ou un pack.")
                  return
                }
                if (
                  selectedReconversion?.accessKind === "reconversion_pack" &&
                  !selectedPackModule
                ) {
                  toast.error("Choisissez le module du pack pour cette session.")
                  return
                }
                createMut.mutate()
              }}
            >
              {createMut.isPending ? "Création…" : "Créer"}
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-neutral-100 bg-neutral-50 p-4"
            >
              <div className="mb-2 h-4 w-2/3 rounded bg-neutral-200" />
              <div className="h-3 w-1/2 rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      ) : null}

      {isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : "Impossible de charger les sessions."}
        </p>
      ) : null}

      {!isLoading && !isError && visibleSessions.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          Aucune session active. Créez votre première session.
        </p>
      ) : null}

      {!isLoading && !isError && visibleSessions.length > 0 ? (
        <ul className="space-y-3">
          {visibleSessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-neutral-900">{session.sessionLabel}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {session.accesses.map((a) => (
                    <span
                      key={a.id}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        a.accessKind === "reconversion_pack"
                          ? "bg-violet-200 text-violet-900"
                          : a.accessKind === "reconversion_module"
                            ? "bg-violet-100 text-violet-800"
                            : "bg-sky-100 text-sky-800",
                      )}
                    >
                      {accessKindLabel(a.accessKind)} · {a.moduleLabel}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {session.memberCount} apprenants · {session.sessionCount} séances
                </p>
                {session.pendingSessionCount > 0 ? (
                  <span className="mt-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                    ⚠ {session.pendingSessionCount} en attente
                  </span>
                ) : (
                  <span className="mt-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    ✓ À jour
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-neutral-300"
                onClick={() => onManage(session)}
              >
                Gérer
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
