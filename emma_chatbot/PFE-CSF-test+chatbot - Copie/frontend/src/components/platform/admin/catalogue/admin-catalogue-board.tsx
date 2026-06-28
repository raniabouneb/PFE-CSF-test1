"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { FileText, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { AdminCatalogueKpis } from "@/components/platform/admin/catalogue/admin-catalogue-kpis"
import { useAdminViewer } from "@/components/platform/admin/admin-viewer-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ADMIN_DASHBOARD_CARD_CLASS } from "@/lib/admin/dashboard-card-styles"
import {
  type CatalogueModuleDto,
  type CatalogueSupportPdf,
  createCatalogueModule,
  deleteCatalogueModule,
  deleteModuleSupportPdf,
  fetchCatalogueFilters,
  fetchCatalogueModules,
  patchCatalogueModule,
  uploadModuleSupportPdf,
  type CatalogueFiltersPayload,
} from "@/lib/admin/catalogue-api"
import { MODULE_FORMAT_LABELS, type ModuleFormat } from "@/lib/admin/catalogue-mock-data"
import { cn } from "@/lib/utils"

type MainFormatFilter = "all" | ModuleFormat

type FormState = {
  titre: string
  description: string
  format: ModuleFormat
  reconversionTopicSlug: string
  reconversionPackId: string
  ponctuelleFormationSlug: string
  dureeHeures: number
  nombreLabs: number
  examen: boolean
  durationText: string
  practiceText: string
  projectText: string
  evaluationText: string
  imageUrl: string
  supportsPdf: CatalogueSupportPdf[]
  pendingFiles: File[]
}

const EMPTY_FORM: FormState = {
  titre: "",
  description: "",
  format: "reconversion",
  reconversionTopicSlug: "",
  reconversionPackId: "",
  ponctuelleFormationSlug: "",
  dureeHeures: 24,
  nombreLabs: 2,
  examen: true,
  durationText: "",
  practiceText: "",
  projectText: "",
  evaluationText: "",
  imageUrl: "",
  supportsPdf: [],
  pendingFiles: [],
}

function segmentLabel(m: CatalogueModuleDto): string {
  if (m.format === "sur_mesure") return "—"
  return m.segmentLabel ?? m.segmentSlug ?? "—"
}

function displayDuration(m: CatalogueModuleDto): string {
  return m.durationText?.trim() || `${m.dureeHeures} h`
}

function displayPractice(m: CatalogueModuleDto): string {
  return m.practiceText?.trim() || `${m.nombreLabs} labs`
}

function displayProject(m: CatalogueModuleDto): string {
  return m.projectText?.trim() || "—"
}

function displayEvaluation(m: CatalogueModuleDto): string {
  return m.evaluationText?.trim() || (m.examen ? "Examen final" : "Évaluation continue")
}

function pickDefaultReconversionTopicId(filters: CatalogueFiltersPayload | null): string {
  if (!filters?.reconversionTopics?.length) return ""
  const embarque = filters.reconversionTopics.find((t) => t.label.toLowerCase().includes("embarqu"))
  return embarque?.id ?? filters.reconversionTopics[0]!.id
}

function pickFirstPackKindForTopic(
  packs: CatalogueFiltersPayload["reconversionPacks"] | undefined,
  topicSlug: string,
): "" | "full" | "mini" {
  if (!packs?.length || !topicSlug) return ""
  const kinds = new Set(
    packs
      .filter((p) => p.topicSlug === topicSlug)
      .map((p) => p.packKind)
      .filter((k): k is "full" | "mini" => k === "full" || k === "mini"),
  )
  if (kinds.has("full")) return "full"
  if (kinds.has("mini")) return "mini"
  return ""
}

function pickFirstPackId(
  packs: CatalogueFiltersPayload["reconversionPacks"] | undefined,
  topicSlug: string,
  packKind: "" | "full" | "mini",
): string {
  if (!packs?.length || !topicSlug || !packKind) return ""
  return packs.find((p) => p.topicSlug === topicSlug && p.packKind === packKind)?.id ?? ""
}

export function AdminCatalogueBoard() {
  const { canWrite } = useAdminViewer()
  const writeCatalogue = canWrite("catalogue")
  const [filters, setFilters] = useState<CatalogueFiltersPayload | null>(null)
  const [modules, setModules] = useState<CatalogueModuleDto[]>([])
  const [listTotal, setListTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)

  const [mainFormat, setMainFormat] = useState<MainFormatFilter>("reconversion")
  const [rcSlug, setRcSlug] = useState<string>("")
  const [rcPackKind, setRcPackKind] = useState<"" | "full" | "mini">("")
  const [rcPackId, setRcPackId] = useState<string>("")
  const [pnSlug, setPnSlug] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400)
    return () => window.clearTimeout(t)
  }, [search])

  const loadFilters = useCallback(async () => {
    const data = await fetchCatalogueFilters()
    setFilters(data)
  }, [])

  const loadModules = useCallback(async () => {
    setListLoading(true)
    try {
      const segment =
        mainFormat === "reconversion" && rcSlug
          ? rcSlug
          : mainFormat === "ponctuelle" && pnSlug !== "all"
            ? pnSlug
            : undefined
      const data = await fetchCatalogueModules({
        format: mainFormat,
        segment,
        reconversionPackId: mainFormat === "reconversion" ? rcPackId || undefined : undefined,
        search: debouncedSearch,
        page: 1,
        pageSize: 200,
      })
      setModules(data.items)
      setListTotal(data.total)
    } catch {
      setModules([])
      setListTotal(0)
    } finally {
      setListLoading(false)
    }
  }, [mainFormat, rcSlug, rcPackId, pnSlug, debouncedSearch])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        await loadFilters()
        if (cancelled) return
      } catch {
        if (!cancelled) setFilters(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadFilters])

  useEffect(() => {
    if (!filters) return
    if (!rcSlug) {
      setRcSlug(pickDefaultReconversionTopicId(filters))
    }
  }, [filters, rcSlug])

  useEffect(() => {
    if (!filters || !rcSlug) return
    const defaultKind = pickFirstPackKindForTopic(filters.reconversionPacks, rcSlug)
    if (!defaultKind) {
      if (rcPackKind) setRcPackKind("")
      if (rcPackId) setRcPackId("")
      return
    }
    const kindToUse = rcPackKind || defaultKind
    if (rcPackKind !== kindToUse) {
      setRcPackKind(kindToUse)
      return
    }
    const packExistsForKind = filters.reconversionPacks.some(
      (p) => p.topicSlug === rcSlug && p.packKind === kindToUse && p.id === rcPackId,
    )
    if (packExistsForKind) return
    const defaultPackId = pickFirstPackId(filters.reconversionPacks, rcSlug, kindToUse)
    if (defaultPackId && rcPackId !== defaultPackId) {
      setRcPackId(defaultPackId)
    }
  }, [filters, rcSlug, rcPackKind, rcPackId])

  useEffect(() => {
    if (loading) return
    void loadModules()
  }, [loading, loadModules])

  const supportsPdfCount = useMemo(
    () => modules.reduce((acc, m) => acc + m.supportsPdf.length, 0),
    [modules],
  )
  const totalHeures = useMemo(
    () => modules.reduce((acc, m) => acc + m.dureeHeures, 0),
    [modules],
  )

  const filtered = modules

  const setMainFormatAndResetSubs = (v: MainFormatFilter) => {
    setMainFormat(v)
    if (v === "reconversion") {
      setRcSlug(pickDefaultReconversionTopicId(filters))
      setPnSlug("all")
      return
    }
    if (v === "ponctuelle") {
      setPnSlug(filters?.ponctuelleFormations?.[0]?.id ?? "all")
      setRcPackKind("")
      setRcPackId("")
      return
    }
    setRcPackKind("")
    setRcPackId("")
    setPnSlug("all")
  }

  const openCreate = () => {
    const firstRc = filters?.reconversionTopics[0]?.id ?? ""
    const firstPn = filters?.ponctuelleFormations[0]?.id ?? ""
    const scopedFormat: ModuleFormat =
      mainFormat === "reconversion" || mainFormat === "ponctuelle" || mainFormat === "sur_mesure"
        ? mainFormat
        : "reconversion"
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      format: scopedFormat,
      reconversionTopicSlug: pickDefaultReconversionTopicId(filters) || firstRc,
      reconversionPackId: "",
      ponctuelleFormationSlug: firstPn,
    })
    setModalOpen(true)
  }

  const openEdit = (m: CatalogueModuleDto) => {
    setEditingId(m.id)
    setForm({
      titre: m.titre,
      description: m.description,
      format: m.format,
      reconversionTopicSlug: m.segmentSlug ?? pickDefaultReconversionTopicId(filters),
      reconversionPackId: m.reconversionPackId ?? "",
      ponctuelleFormationSlug: m.segmentSlug ?? filters?.ponctuelleFormations[0]?.id ?? "",
      dureeHeures: m.dureeHeures,
      nombreLabs: m.nombreLabs,
      examen: m.examen,
      durationText: m.durationText ?? "",
      practiceText: m.practiceText ?? "",
      projectText: m.projectText ?? "",
      evaluationText: m.evaluationText ?? "",
      imageUrl: m.imageUrl ?? "",
      supportsPdf: [...m.supportsPdf],
      pendingFiles: [],
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
  }

  const saveModule = async () => {
    if (!form.titre.trim()) {
      toast.error("Le titre est obligatoire.")
      return
    }
    if (form.format === "reconversion" && !form.reconversionTopicSlug) {
      toast.error("Choisissez un parcours Reconversion.")
      return
    }
    if (form.format === "ponctuelle" && !form.ponctuelleFormationSlug) {
      toast.error("Choisissez une formation Ponctuelle.")
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const body: Record<string, unknown> = {
          titre: form.titre.trim(),
          description: form.description,
          dureeHeures: form.dureeHeures,
          nombreLabs: form.nombreLabs,
          examen: form.examen,
        }
        if (form.format === "reconversion") {
          body.reconversionTopicSlug = form.reconversionTopicSlug
          if (form.reconversionPackId) body.reconversionPackId = form.reconversionPackId
          body.durationText = form.durationText
          body.practiceText = form.practiceText
          body.projectText = form.projectText
          body.evaluationText = form.evaluationText
          body.imageUrl = form.imageUrl
        }
        if (form.format === "ponctuelle") {
          body.ponctuelleFormationSlug = form.ponctuelleFormationSlug
          body.durationText = form.durationText
          body.practiceText = form.practiceText
          body.projectText = form.projectText
          body.evaluationText = form.evaluationText
          body.imageUrl = form.imageUrl
        }
        await patchCatalogueModule(editingId, body)
        toast.success("Module mis à jour.")
      } else {
        const body: Record<string, unknown> = {
          titre: form.titre.trim(),
          description: form.description,
          format: form.format,
          dureeHeures: form.dureeHeures,
          nombreLabs: form.nombreLabs,
          examen: form.examen,
        }
        if (form.format === "reconversion") {
          body.reconversionTopicSlug = form.reconversionTopicSlug
          if (form.reconversionPackId) body.reconversionPackId = form.reconversionPackId
          body.durationText = form.durationText
          body.practiceText = form.practiceText
          body.projectText = form.projectText
          body.evaluationText = form.evaluationText
          body.imageUrl = form.imageUrl
        }
        if (form.format === "ponctuelle") {
          body.ponctuelleFormationSlug = form.ponctuelleFormationSlug
          body.durationText = form.durationText
          body.practiceText = form.practiceText
          body.projectText = form.projectText
          body.evaluationText = form.evaluationText
          body.imageUrl = form.imageUrl
        }
        const created = await createCatalogueModule(body)
        for (const f of form.pendingFiles) {
          await uploadModuleSupportPdf(created.id, f)
        }
        toast.success("Module créé.")
      }
      await loadFilters()
      await loadModules()
      closeModal()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.")
    } finally {
      setSaving(false)
    }
  }

  const deleteModule = async (m: CatalogueModuleDto) => {
    if (!window.confirm(`Supprimer le module « ${m.titre} » ?`)) return
    try {
      await deleteCatalogueModule(m.id)
      toast.success("Module supprimé.")
      await loadFilters()
      await loadModules()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible.")
    }
  }

  const onPdfPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const picked = Array.from(files)

    if (editingId) {
      try {
        const added: CatalogueSupportPdf[] = []
        for (const f of picked) {
          added.push(await uploadModuleSupportPdf(editingId, f))
        }
        setForm((prev) => ({ ...prev, supportsPdf: [...prev.supportsPdf, ...added] }))
        toast.success("PDF ajouté(s).")
        await loadModules()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload impossible.")
      }
    } else {
      setForm((f) => ({ ...f, pendingFiles: [...f.pendingFiles, ...picked] }))
      toast.message("PDF ajoutés — ils seront envoyés après création du module.")
    }
    e.target.value = ""
  }

  const removeServerPdf = async (sup: CatalogueSupportPdf) => {
    if (!editingId) return
    try {
      await deleteModuleSupportPdf(editingId, sup.id)
      setForm((f) => ({ ...f, supportsPdf: f.supportsPdf.filter((x) => x.id !== sup.id) }))
      toast.success("Support retiré.")
      await loadModules()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible.")
    }
  }

  const removePendingPdf = (pf: File) => {
    setForm((f) => ({
      ...f,
      pendingFiles: f.pendingFiles.filter(
        (x) => !(x.name === pf.name && x.size === pf.size && x.lastModified === pf.lastModified),
      ),
    }))
  }

  const filterActive =
    mainFormat !== "all" ||
    !!rcSlug ||
    !!rcPackKind ||
    !!rcPackId ||
    pnSlug !== "all" ||
    search.trim().length > 0

  const rcTopics = filters?.reconversionTopics ?? []
  const rcPacksAll = filters?.reconversionPacks ?? []
  const rcPackKinds = Array.from(
    new Set(
      rcPacksAll
        .filter((p) => p.topicSlug === rcSlug)
        .map((p) => p.packKind)
        .filter((k): k is "full" | "mini" => k === "full" || k === "mini"),
    ),
  )
  const rcPacks = rcPacksAll.filter(
    (p) => p.topicSlug === rcSlug && (!rcPackKind || p.packKind === rcPackKind),
  )
  const rcPacksVisible = rcPackKind ? rcPacks : []
  const pnForms = filters?.ponctuelleFormations ?? []

  if (loading && !filters) {
    return (
      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        <p className="text-sm text-neutral-600">Chargement du catalogue…</p>
      </main>
    )
  }

  return (
    <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="sr-only">Catalogue de formation — modules</h1>
      </div>

      <div className="space-y-10">
        <AdminCatalogueKpis
          moduleCount={filters?.kpis.modules ?? modules.length}
          supportsPdfCount={filters?.kpis.supports ?? supportsPdfCount}
          totalHeures={filters?.kpis.totalHours ?? totalHeures}
        />

        <section aria-labelledby="catalogue-modules-heading">
          <div className={cn(ADMIN_DASHBOARD_CARD_CLASS, "overflow-hidden p-0")}>
            <div className="space-y-4 p-5 sm:p-6 sm:space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                <div className="min-w-0">
                  <h2 id="catalogue-modules-heading" className="text-lg font-semibold text-[#0f172a]">
                    Catalogue de formation
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Gestion des modules — filtres dynamiques (parcours & formations), recherche et CRUD branchés
                    sur l’API.
                  </p>
                </div>
                {writeCatalogue ? (
                  <Button
                    type="button"
                    className="shrink-0 bg-[#0D3570] hover:bg-[#0a2a5c] lg:self-start"
                    onClick={openCreate}
                    disabled={!filters}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Ajouter un modul
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["reconversion", MODULE_FORMAT_LABELS.reconversion],
                    ["ponctuelle", MODULE_FORMAT_LABELS.ponctuelle],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMainFormatAndResetSubs(key)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      mainFormat === key
                        ? "border-[#0D3570] bg-[#0D3570] text-white"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mainFormat === "reconversion" ? (
                <div className="rounded-xl border border-neutral-200/80 bg-white/60 p-3 sm:p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0c2744]">
                    Reconversion — parcours
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rcTopics.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setRcSlug(id)
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          rcSlug === id
                            ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-[#0c2744]">
                    Reconversion — type de pack
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rcPackKinds.map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => {
                          setRcPackKind(kind)
                          setRcPackId(pickFirstPackId(filters?.reconversionPacks, rcSlug, kind))
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium uppercase transition-colors",
                          rcPackKind === kind
                            ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                        )}
                      >
                        {kind}
                      </button>
                    ))}
                  </div>
                  <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-[#0c2744]">
                    Reconversion — pack
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rcPacksVisible.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setRcPackId(id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          rcPackId === id
                            ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                    {rcPackKind && rcPacksVisible.length === 0 ? (
                      <p className="text-xs text-neutral-500">Aucun pack disponible pour ce type.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {mainFormat === "ponctuelle" ? (
                <div className="rounded-xl border border-neutral-200/80 bg-white/60 p-3 sm:p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0c2744]">
                    Ponctuelle — formation
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPnSlug("all")}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        pnSlug === "all"
                          ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                      )}
                    >
                      Toutes les formations
                    </button>
                    {pnForms.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPnSlug(id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          pnSlug === id
                            ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <Input
                type="search"
                placeholder="Rechercher par titre, description ou segment…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-full border-neutral-200 bg-white"
                aria-label="Filtrer la liste"
              />
              {listLoading ? (
                <p className="text-xs text-neutral-500">Mise à jour de la liste…</p>
              ) : null}
            </div>

            <div className="border-t border-neutral-200/80 bg-white/30">
              <div className="overflow-x-hidden">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200/80 bg-white/90">
                      <th className="w-[16%] px-3 py-3 font-semibold text-[#0f172a]">Titre</th>
                      <th className="w-[14%] px-3 py-3 font-semibold text-[#0f172a]">
                        Parcours / formation
                      </th>
                      <th className="w-[8%] px-3 py-3 font-semibold text-[#0f172a]">Durée</th>
                      <th className="w-[9%] px-3 py-3 font-semibold text-[#0f172a]">Pratique</th>
                      <th className="w-[27%] px-3 py-3 font-semibold text-[#0f172a]">Projet</th>
                      <th className="w-[14%] px-3 py-3 font-semibold text-[#0f172a]">Évaluation</th>
                      <th className="w-[6%] px-3 py-3 font-semibold text-[#0f172a]">Supports</th>
                      <th className="w-[6%] px-3 py-3 font-semibold text-[#0f172a]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-neutral-200/60 bg-[#f4f7fb]/80 transition-colors hover:bg-white/95"
                      >
                        <td className="break-words px-3 py-3 font-medium leading-snug text-[#0f172a]">{m.titre}</td>
                        <td className="break-words px-3 py-3 text-xs leading-snug text-neutral-700">
                          {segmentLabel(m)}
                        </td>
                        <td className="break-words px-3 py-3 leading-snug text-neutral-700">{displayDuration(m)}</td>
                        <td className="break-words px-3 py-3 leading-snug text-neutral-700">{displayPractice(m)}</td>
                        <td className="break-words px-3 py-3 leading-snug text-neutral-700">{displayProject(m)}</td>
                        <td className="break-words px-3 py-3 leading-snug text-neutral-700">
                          {displayEvaluation(m)}
                        </td>
                        <td className="px-3 py-3 text-xs text-neutral-600">
                          {m.supportsPdf.length ? (
                            <span className="inline-flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-[#0D3570]" aria-hidden />
                              {m.supportsPdf.length} PDF
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {writeCatalogue ? (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              className="border-neutral-200"
                              onClick={() => openEdit(m)}
                              aria-label={`Modifier ${m.titre}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              onClick={() => deleteModule(m)}
                              aria-label={`Supprimer ${m.titre}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-neutral-600">
                  Aucun module ne correspond aux filtres.
                </p>
              ) : null}
            </div>

            <p className="border-t border-neutral-200/60 px-5 py-3 text-xs text-neutral-500 sm:px-6">
              Affichage : {filtered.length} module{filtered.length > 1 ? "s" : ""}
              {listTotal > filtered.length ? ` sur ${listTotal} au total` : ""}
              {filterActive ? " (filtré)" : ""}
            </p>
          </div>
        </section>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="catalogue-modal-title"
        >
          <div className="relative max-h-[min(92vh,860px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-100 bg-white px-5 py-4">
              <h3 id="catalogue-modal-title" className="text-lg font-semibold text-[#0f172a]">
                {editingId ? "Modifier le module" : "Nouveau module"}
              </h3>
              <button
                type="button"
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                onClick={closeModal}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label htmlFor="mod-titre" className="text-sm font-medium text-neutral-700">
                  Titre
                </label>
                <Input
                  id="mod-titre"
                  value={form.titre}
                  onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                  className="mt-1 border-neutral-200"
                  placeholder="Ex. Cloud AWS — niveau débutant"
                />
              </div>

              <div>
                <label htmlFor="mod-desc" className="text-sm font-medium text-neutral-700">
                  Description
                </label>
                <Textarea
                  id="mod-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 min-h-[100px] border-neutral-200"
                  placeholder="Objectifs, public visé, prérequis…"
                />
              </div>

              <div>
                <label htmlFor="mod-image-url" className="text-sm font-medium text-neutral-700">
                  Image du module (URL)
                </label>
                <Input
                  id="mod-image-url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="mt-1 border-neutral-200"
                  placeholder="https://... (optionnel)"
                />
              </div>

              {mainFormat === "all" ? (
                <div>
                  <label htmlFor="mod-format" className="text-sm font-medium text-neutral-700">
                    Format
                  </label>
                  <select
                    id="mod-format"
                    value={form.format}
                    onChange={(e) => {
                      const fmt = e.target.value as ModuleFormat
                      setForm((f) => ({
                        ...f,
                        format: fmt,
                      }))
                    }}
                    className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[#0D3570]/30"
                  >
                    {(Object.keys(MODULE_FORMAT_LABELS) as ModuleFormat[]).map((k) => (
                      <option key={k} value={k}>
                        {MODULE_FORMAT_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-neutral-700">Format</label>
                  <Input
                    value={MODULE_FORMAT_LABELS[form.format]}
                    readOnly
                    className="mt-1 border-neutral-200 bg-neutral-50 text-neutral-700"
                  />
                </div>
              )}

              {form.format === "reconversion" ? (
                <div>
                  <label htmlFor="mod-parcours" className="text-sm font-medium text-neutral-700">
                    Parcours Reconversion
                  </label>
                  <select
                    id="mod-parcours"
                    value={form.reconversionTopicSlug}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        reconversionTopicSlug: e.target.value,
                        reconversionPackId: "",
                      }))
                    }
                    className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[#0D3570]/30"
                  >
                    {rcTopics.map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="mod-pack" className="mt-3 block text-sm font-medium text-neutral-700">
                    Pack Reconversion
                  </label>
                  <select
                    id="mod-pack"
                    value={form.reconversionPackId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        reconversionPackId: e.target.value,
                      }))
                    }
                    className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[#0D3570]/30"
                  >
                    <option value="">Pack par défaut du parcours</option>
                    {rcPacks
                      .filter((p) => p.topicSlug === form.reconversionTopicSlug)
                      .map(({ id, label }) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                  </select>
                </div>
              ) : null}

              {form.format === "ponctuelle" ? (
                <div>
                  <label htmlFor="mod-domaine" className="text-sm font-medium text-neutral-700">
                    Formation ponctuelle
                  </label>
                  <select
                    id="mod-domaine"
                    value={form.ponctuelleFormationSlug}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        ponctuelleFormationSlug: e.target.value,
                      }))
                    }
                    className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[#0D3570]/30"
                  >
                    {pnForms.map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {form.format === "ponctuelle" || form.format === "reconversion" ? (
                <>
                  <div>
                    <label htmlFor="mod-duration-text" className="text-sm font-medium text-neutral-700">
                      Durée
                    </label>
                    <Input
                      id="mod-duration-text"
                      value={form.durationText}
                      onChange={(e) => setForm((f) => ({ ...f, durationText: e.target.value }))}
                      className="mt-1 border-neutral-200"
                      placeholder="ex: 14 - 35 h"
                    />
                  </div>
                  <div>
                    <label htmlFor="mod-practice-text" className="text-sm font-medium text-neutral-700">
                      Pratique
                    </label>
                    <Input
                      id="mod-practice-text"
                      value={form.practiceText}
                      onChange={(e) => setForm((f) => ({ ...f, practiceText: e.target.value }))}
                      className="mt-1 border-neutral-200"
                      placeholder="ex: +15 Labs"
                    />
                  </div>
                  <div>
                    <label htmlFor="mod-project-text" className="text-sm font-medium text-neutral-700">
                      Projet
                    </label>
                    <Input
                      id="mod-project-text"
                      value={form.projectText}
                      onChange={(e) => setForm((f) => ({ ...f, projectText: e.target.value }))}
                      className="mt-1 border-neutral-200"
                      placeholder="ex: CAN sur STM32"
                    />
                  </div>
                  <div>
                    <label htmlFor="mod-eval-text" className="text-sm font-medium text-neutral-700">
                      Évaluation
                    </label>
                    <Input
                      id="mod-eval-text"
                      value={form.evaluationText}
                      onChange={(e) => setForm((f) => ({ ...f, evaluationText: e.target.value }))}
                      className="mt-1 border-neutral-200"
                      placeholder="ex: 2 Tests"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="mod-duree" className="text-sm font-medium text-neutral-700">
                        Durée (heures)
                      </label>
                      <Input
                        id="mod-duree"
                        type="number"
                        min={1}
                        max={500}
                        value={form.dureeHeures}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, dureeHeures: Number(e.target.value) || 0 }))
                        }
                        className="mt-1 border-neutral-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="mod-labs" className="text-sm font-medium text-neutral-700">
                        Nombre de labs
                      </label>
                      <Input
                        id="mod-labs"
                        type="number"
                        min={0}
                        max={50}
                        value={form.nombreLabs}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, nombreLabs: Number(e.target.value) || 0 }))
                        }
                        className="mt-1 border-neutral-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="mod-examen"
                      checked={form.examen}
                      onCheckedChange={(c) => setForm((f) => ({ ...f, examen: c === true }))}
                      className="border-neutral-300 data-[state=checked]:border-[#0D3570] data-[state=checked]:bg-[#0D3570]"
                    />
                    <label htmlFor="mod-examen" className="text-sm font-medium text-neutral-700">
                      Examen / certification en fin de module
                    </label>
                  </div>
                </>
              )}

              <div>
                <span className="text-sm font-medium text-neutral-700">Supports de cours (PDF)</span>
                <p className="mt-0.5 text-xs text-neutral-500">
                  PDF uniquement — stockage local serveur, lien public pour les pages formation.
                </p>
                <Input type="file" accept=".pdf,application/pdf" multiple className="mt-2" onChange={onPdfPick} />
                {form.supportsPdf.length > 0 || form.pendingFiles.length > 0 ? (
                  <ul className="mt-3 space-y-1 rounded-lg border border-neutral-100 bg-neutral-50/80 p-3 text-xs">
                    {form.supportsPdf.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1 truncate text-neutral-700">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-[#0D3570]" aria-hidden />
                          {s.fileName}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 text-red-600 hover:underline"
                          onClick={() => void removeServerPdf(s)}
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                    {form.pendingFiles.map((pf) => (
                      <li
                        key={`${pf.name}-${pf.size}-${pf.lastModified}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="flex min-w-0 items-center gap-1 truncate text-neutral-700">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-[#0D3570]" aria-hidden />
                          {pf.name}{" "}
                          <span className="text-neutral-400">(envoi après création)</span>
                        </span>
                        <button
                          type="button"
                          className="shrink-0 text-red-600 hover:underline"
                          onClick={() => removePendingPdf(pf)}
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
                  Annuler
                </Button>
                <Button
                  type="button"
                  className="bg-[#0D3570] hover:bg-[#0a2a5c]"
                  onClick={() => void saveModule()}
                  disabled={saving}
                >
                  {editingId ? "Enregistrer" : "Créer le module"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
