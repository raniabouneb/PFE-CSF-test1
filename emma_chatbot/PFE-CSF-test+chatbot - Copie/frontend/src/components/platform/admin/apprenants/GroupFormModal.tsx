"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ApprenantFiltersPayload, ApprenantFormat } from "@/lib/admin/apprenants-api"
import {
  fetchPonctuelleFormationModules,
  type PonctuelleFormationModule,
} from "@/lib/admin/catalogue-api"

type GroupFormModalProps = {
  filtersPayload: ApprenantFiltersPayload | null
  defaultFormat: "all" | ApprenantFormat
  saving: boolean
  onClose: () => void
  onSubmit: (body: Record<string, unknown>) => Promise<void> | void
}

function pickDefaultFormat(v: "all" | ApprenantFormat): ApprenantFormat {
  return v === "all" ? "reconversion" : v
}

export default function GroupFormModal({
  filtersPayload,
  defaultFormat,
  saving,
  onClose,
  onSubmit,
}: GroupFormModalProps) {
  const initialFormat = pickDefaultFormat(defaultFormat)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [format, setFormat] = useState<ApprenantFormat>(initialFormat)
  const [reconversionTopicSlug, setReconversionTopicSlug] = useState(filtersPayload?.reconversionTopics[0]?.id ?? "")
  const [reconversionPackId, setReconversionPackId] = useState("")
  const [ponctuelleFormationSlug, setPonctuelleFormationSlug] = useState(filtersPayload?.ponctuelleFormations?.[0]?.id ?? "")
  const [ponctuelleModules, setPonctuelleModules] = useState<PonctuelleFormationModule[]>([])
  const [ponctuelleLoading, setPonctuelleLoading] = useState(false)
  const [ponctuelleSearch, setPonctuelleSearch] = useState("")
  const [selectedPonctuelleModuleRefs, setSelectedPonctuelleModuleRefs] = useState<string[]>([])
  const [startDate, setStartDate] = useState("")
  const [status, setStatus] = useState<"pending" | "active" | "terminee" | "suspendue">("pending")

  const packOptions = useMemo(
    () => (filtersPayload?.reconversionPacks ?? []).filter((p) => p.topicSlug === reconversionTopicSlug),
    [filtersPayload, reconversionTopicSlug],
  )

  useEffect(() => {
    if (format !== "ponctuelle" || !ponctuelleFormationSlug) {
      setPonctuelleModules([])
      return
    }
    let cancelled = false
    setPonctuelleLoading(true)
    ;(async () => {
      try {
        const data = await fetchPonctuelleFormationModules(ponctuelleFormationSlug)
        if (!cancelled) setPonctuelleModules(data.modules)
      } catch {
        if (!cancelled) setPonctuelleModules([])
      } finally {
        if (!cancelled) setPonctuelleLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [format, ponctuelleFormationSlug])

  const filteredPonctuelleModules = useMemo(() => {
    const needle = ponctuelleSearch.trim().toLowerCase()
    if (!needle) return ponctuelleModules
    return ponctuelleModules.filter(
      (m) =>
        m.title.toLowerCase().includes(needle) ||
        (m.description ?? "").toLowerCase().includes(needle),
    )
  }, [ponctuelleModules, ponctuelleSearch])

  const submit = async () => {
    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      format,
      status,
      startDate: startDate || null,
    }
    if (format === "reconversion") {
      body.reconversionTopicSlug = reconversionTopicSlug || null
      body.reconversionPackId = reconversionPackId || null
    }
    if (format === "ponctuelle") {
      body.ponctuelleFormationSlug = ponctuelleFormationSlug || null
      body.ponctuelleModuleRefs = selectedPonctuelleModuleRefs
    }
    await onSubmit(body)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-[#0f172a]">Ajouter un groupe</h3>
          <button
            type="button"
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="text-sm font-medium text-neutral-700">Nom du groupe</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 border-neutral-200" />
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 min-h-[90px] border-neutral-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ApprenantFormat)}
                className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
              >
                <option value="reconversion">Reconversion</option>
                <option value="ponctuelle">Ponctuelle</option>
                <option value="sur_mesure">Sur mesure</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Date de début</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 border-neutral-200" />
            </div>
          </div>

          {format === "reconversion" ? (
            <>
              <div>
                <label className="text-sm font-medium text-neutral-700">Parcours reconversion</label>
                <select
                  value={reconversionTopicSlug}
                  onChange={(e) => {
                    setReconversionTopicSlug(e.target.value)
                    setReconversionPackId("")
                  }}
                  className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                >
                  {(filtersPayload?.reconversionTopics ?? []).map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Pack reconversion</label>
                <select
                  value={reconversionPackId}
                  onChange={(e) => setReconversionPackId(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                >
                  <option value="">Pack par défaut du parcours</option>
                  {packOptions.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          {format === "ponctuelle" ? (
            <>
              <div>
                <label className="text-sm font-medium text-neutral-700">Formation ponctuelle</label>
                <select
                  value={ponctuelleFormationSlug}
                  onChange={(e) => {
                    setPonctuelleFormationSlug(e.target.value)
                    setSelectedPonctuelleModuleRefs([])
                    setPonctuelleSearch("")
                  }}
                  className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
                >
                  {(filtersPayload?.ponctuelleFormations ?? []).length === 0 && (
                    <option value="">Aucune formation ponctuelle</option>
                  )}
                  {(filtersPayload?.ponctuelleFormations ?? []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {ponctuelleFormationSlug && (
                <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Modules du groupe</label>
                    <p className="mt-1 text-xs text-neutral-500">
                      Sélectionnez les modules à inclure dans ce groupe.
                    </p>
                  </div>
                  {ponctuelleModules.length > 5 && (
                    <Input
                      value={ponctuelleSearch}
                      onChange={(e) => setPonctuelleSearch(e.target.value)}
                      placeholder="Filtrer les modules..."
                      className="border-neutral-200"
                    />
                  )}
                  <div className="max-h-[280px] space-y-2 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    {ponctuelleLoading ? (
                      <p className="text-sm text-neutral-500">Chargement des modules...</p>
                    ) : filteredPonctuelleModules.length === 0 ? (
                      <p className="text-sm text-neutral-500">Aucun module trouvé pour cette formation.</p>
                    ) : (
                      filteredPonctuelleModules.map((module) => {
                        const ref = `ponctuelle_module:${module.id}`
                        const checked = selectedPonctuelleModuleRefs.includes(ref)
                        return (
                          <label
                            key={module.id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-white bg-white px-3 py-2"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setSelectedPonctuelleModuleRefs((prev) =>
                                  e.target.checked
                                    ? [...prev, ref]
                                    : prev.filter((item) => item !== ref)
                                )
                              }
                              className="mt-1"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1a2a3a]">{module.title}</p>
                              <p className="text-xs text-neutral-500">
                                {module.duration} {module.project ? `• ${module.project}` : ""}
                              </p>
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                  <p className="text-xs text-neutral-600">
                    {selectedPonctuelleModuleRefs.length} module{selectedPonctuelleModuleRefs.length > 1 ? "s" : ""} sélectionné
                    {selectedPonctuelleModuleRefs.length > 1 ? "s" : ""}.
                  </p>
                </div>
              )}
            </>
          ) : null}

          <div>
            <label className="text-sm font-medium text-neutral-700">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "pending" | "active" | "terminee" | "suspendue")}
              className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
            >
              <option value="pending">En attente</option>
              <option value="active">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="suspendue">Suspendue</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-[#0D3570] hover:bg-[#0a2a5c]"
              onClick={() => void submit()}
              disabled={saving || !name.trim() || (format === "ponctuelle" && selectedPonctuelleModuleRefs.length === 0)}
            >
              Créer le groupe
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
