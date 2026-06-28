"use client"

import { useMemo, useState } from "react"
import { FileText, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { AdminCatalogueKpis } from "@/components/platform/admin/catalogue/admin-catalogue-kpis"
import { useAdminViewer } from "@/components/platform/admin/admin-viewer-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ADMIN_DASHBOARD_CARD_CLASS,
} from "@/lib/admin/dashboard-card-styles"
import {
  type CatalogueModule,
  type ModuleFormat,
  type PonctuelleDomainId,
  type ReconversionParcoursId,
  CATALOGUE_MODULES_INITIAL,
  MODULE_FORMAT_LABELS,
  PONCTUELLE_DOMAINES,
  RECONVERSION_PARCOURS,
  RECONVERSION_PARCOURS_LIST,
  labelPonctuelleDomain,
} from "@/lib/admin/catalogue-mock-data"
import { cn } from "@/lib/utils"

type MainFormatFilter = "all" | ModuleFormat

const EMPTY_FORM: Omit<CatalogueModule, "id"> = {
  titre: "",
  description: "",
  format: "reconversion",
  reconversionParcours: "embarque",
  ponctuelleDomaine: "dev",
  dureeHeures: 24,
  nombreLabs: 2,
  examen: true,
  supportsPdf: [],
}

function segmentCell(m: CatalogueModule): string {
  if (m.format === "reconversion" && m.reconversionParcours) {
    return RECONVERSION_PARCOURS[m.reconversionParcours]
  }
  if (m.format === "ponctuelle" && m.ponctuelleDomaine) {
    return labelPonctuelleDomain(m.ponctuelleDomaine)
  }
  if (m.format === "sur_mesure") return "—"
  return "—"
}

function nextModuleId(existing: CatalogueModule[]): string {
  const nums = existing
    .map((m) => {
      const m2 = /^mod-(\d+)$/.exec(m.id)
      return m2 ? parseInt(m2[1]!, 10) : 0
    })
    .filter(Boolean)
  const max = nums.length ? Math.max(...nums) : 0
  return `mod-${String(max + 1).padStart(3, "0")}`
}

function normalizeModule(body: Omit<CatalogueModule, "id">): Omit<CatalogueModule, "id"> {
  return {
    ...body,
    reconversionParcours: body.format === "reconversion" ? body.reconversionParcours : undefined,
    ponctuelleDomaine: body.format === "ponctuelle" ? body.ponctuelleDomaine : undefined,
  }
}

export function AdminCatalogueBoard() {
  const { isAssistant } = useAdminViewer()
  const [modules, setModules] = useState<CatalogueModule[]>(() => [...CATALOGUE_MODULES_INITIAL])
  const [mainFormat, setMainFormat] = useState<MainFormatFilter>("all")
  const [rcParcours, setRcParcours] = useState<"all" | ReconversionParcoursId>("all")
  const [pnDomain, setPnDomain] = useState<"all" | PonctuelleDomainId>("all")
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<CatalogueModule, "id">>(EMPTY_FORM)

  const supportsPdfCount = useMemo(
    () => modules.reduce((acc, m) => acc + m.supportsPdf.length, 0),
    [modules]
  )
  const totalHeures = useMemo(
    () => modules.reduce((acc, m) => acc + m.dureeHeures, 0),
    [modules]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return modules.filter((m) => {
      if (mainFormat !== "all" && m.format !== mainFormat) return false

      if (rcParcours !== "all") {
        if (m.format !== "reconversion" || m.reconversionParcours !== rcParcours) return false
      }
      if (pnDomain !== "all") {
        if (m.format !== "ponctuelle" || m.ponctuelleDomaine !== pnDomain) return false
      }

      if (!q) return true
      return (
        m.titre.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        segmentCell(m).toLowerCase().includes(q)
      )
    })
  }, [modules, mainFormat, rcParcours, pnDomain, search])

  const setMainFormatAndResetSubs = (v: MainFormatFilter) => {
    setMainFormat(v)
    setRcParcours("all")
    setPnDomain("all")
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setModalOpen(true)
  }

  const openEdit = (m: CatalogueModule) => {
    setEditingId(m.id)
    setForm({
      titre: m.titre,
      description: m.description,
      format: m.format,
      reconversionParcours: m.reconversionParcours ?? "embarque",
      ponctuelleDomaine: m.ponctuelleDomaine ?? "dev",
      dureeHeures: m.dureeHeures,
      nombreLabs: m.nombreLabs,
      examen: m.examen,
      supportsPdf: [...m.supportsPdf],
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
  }

  const saveModule = () => {
    if (!form.titre.trim()) {
      toast.error("Le titre est obligatoire.")
      return
    }
    if (form.format === "reconversion" && !form.reconversionParcours) {
      toast.error("Choisissez un parcours Reconversion.")
      return
    }
    if (form.format === "ponctuelle" && !form.ponctuelleDomaine) {
      toast.error("Choisissez un domaine Ponctuelle.")
      return
    }
    const payload = normalizeModule(form)
    if (editingId) {
      setModules((prev) =>
        prev.map((m) => (m.id === editingId ? { ...payload, id: editingId } : m))
      )
      toast.success("Module mis à jour (démo locale).")
    } else {
      const id = nextModuleId(modules)
      setModules((prev) => [...prev, { ...payload, id }])
      toast.success("Module ajouté (démo locale).")
    }
    closeModal()
  }

  const deleteModule = (m: CatalogueModule) => {
    if (!window.confirm(`Supprimer le module « ${m.titre} » ?`)) return
    setModules((prev) => prev.filter((x) => x.id !== m.id))
    toast.success("Module supprimé (démo locale).")
  }

  const onPdfPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const names = Array.from(files).map((f) => f.name)
    setForm((f) => ({ ...f, supportsPdf: [...new Set([...f.supportsPdf, ...names])] }))
    e.target.value = ""
  }

  const removePdf = (name: string) => {
    setForm((f) => ({ ...f, supportsPdf: f.supportsPdf.filter((x) => x !== name) }))
  }

  const filterActive =
    mainFormat !== "all" ||
    rcParcours !== "all" ||
    pnDomain !== "all" ||
    search.trim().length > 0

  return (
    <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="sr-only">Catalogue de formation — modules</h1>
        {isAssistant ? (
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-2 text-sm text-amber-950">
            <span className="font-semibold">Vue assistante.</span> Les modifications catalogue pourront être
            limitées côté API ; ici tout est simulé en local.
          </p>
        ) : null}
      </div>

      <div className="space-y-10">
        <AdminCatalogueKpis
          moduleCount={modules.length}
          supportsPdfCount={supportsPdfCount}
          totalHeures={totalHeures}
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
                    Gestion des modules — choisissez un format pour affiner par parcours ou par domaine, recherche et
                    édition (démo).
                  </p>
                </div>
                <Button
                  type="button"
                  className="shrink-0 bg-[#0D3570] hover:bg-[#0a2a5c] lg:self-start"
                  onClick={openCreate}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Ajouter un modul
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Tous"],
                    ["reconversion", MODULE_FORMAT_LABELS.reconversion],
                    ["ponctuelle", MODULE_FORMAT_LABELS.ponctuelle],
                    ["sur_mesure", MODULE_FORMAT_LABELS.sur_mesure],
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
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
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
                    <button
                      type="button"
                      onClick={() => setRcParcours("all")}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        rcParcours === "all"
                          ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                      )}
                    >
                      Tous les parcours
                    </button>
                    {RECONVERSION_PARCOURS_LIST.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setRcParcours(id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          rcParcours === id
                            ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {mainFormat === "ponctuelle" ? (
                <div className="rounded-xl border border-neutral-200/80 bg-white/60 p-3 sm:p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0c2744]">
                    Ponctuelle — domaine
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPnDomain("all")}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        pnDomain === "all"
                          ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                      )}
                    >
                      Tous les domaines
                    </button>
                    {PONCTUELLE_DOMAINES.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPnDomain(id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          pnDomain === id
                            ? "border-[#0D3570] bg-[#0D3570]/10 text-[#0D3570]"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
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
                placeholder="Rechercher par titre, code, description ou segment…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-full border-neutral-200 bg-white"
                aria-label="Filtrer la liste"
              />
            </div>

            <div className="border-t border-neutral-200/80 bg-white/30">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200/80 bg-white/90">
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-[#0f172a]">Code</th>
                      <th className="min-w-[200px] px-4 py-3 font-semibold text-[#0f172a]">Titre</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-[#0f172a]">Format</th>
                      <th className="min-w-[160px] px-4 py-3 font-semibold text-[#0f172a]">
                        Parcours / domaine
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-[#0f172a]">Durée (h)</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-[#0f172a]">Labs</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-[#0f172a]">Examen</th>
                      <th className="min-w-[120px] px-4 py-3 font-semibold text-[#0f172a]">Supports</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold text-[#0f172a]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-neutral-200/60 bg-[#f4f7fb]/80 transition-colors hover:bg-white/95"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-neutral-600">{m.id}</td>
                        <td className="px-4 py-3 font-medium text-[#0f172a]">{m.titre}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                          {MODULE_FORMAT_LABELS[m.format]}
                        </td>
                        <td className="px-4 py-3 text-xs leading-snug text-neutral-700">{segmentCell(m)}</td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-700">
                          {m.dureeHeures}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-neutral-700">
                          {m.nombreLabs}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{m.examen ? "Oui" : "Non"}</td>
                        <td className="px-4 py-3 text-xs text-neutral-600">
                          {m.supportsPdf.length ? (
                            <span className="inline-flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-[#0D3570]" aria-hidden />
                              {m.supportsPdf.length} PDF
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
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
                      reconversionParcours:
                        fmt === "reconversion" ? f.reconversionParcours ?? "embarque" : undefined,
                      ponctuelleDomaine: fmt === "ponctuelle" ? f.ponctuelleDomaine ?? "dev" : undefined,
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

              {form.format === "reconversion" ? (
                <div>
                  <label htmlFor="mod-parcours" className="text-sm font-medium text-neutral-700">
                    Parcours Reconversion
                  </label>
                  <select
                    id="mod-parcours"
                    value={form.reconversionParcours ?? "embarque"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        reconversionParcours: e.target.value as ReconversionParcoursId,
                      }))
                    }
                    className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[#0D3570]/30"
                  >
                    {RECONVERSION_PARCOURS_LIST.map(({ id, label }) => (
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
                    Domaine Ponctuelle
                  </label>
                  <select
                    id="mod-domaine"
                    value={form.ponctuelleDomaine ?? "dev"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        ponctuelleDomaine: e.target.value as PonctuelleDomainId,
                      }))
                    }
                    className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[#0D3570]/30"
                  >
                    {PONCTUELLE_DOMAINES.map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

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

              <div>
                <span className="text-sm font-medium text-neutral-700">Supports de cours (PDF)</span>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Sélectionnez un ou plusieurs fichiers — les noms sont ajoutés au module (démo, pas d’upload serveur).
                </p>
                <Input type="file" accept=".pdf,application/pdf" multiple className="mt-2" onChange={onPdfPick} />
                {form.supportsPdf.length > 0 ? (
                  <ul className="mt-3 space-y-1 rounded-lg border border-neutral-100 bg-neutral-50/80 p-3 text-xs">
                    {form.supportsPdf.map((name) => (
                      <li key={name} className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1 truncate text-neutral-700">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-[#0D3570]" aria-hidden />
                          {name}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 text-red-600 hover:underline"
                          onClick={() => removePdf(name)}
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Annuler
                </Button>
                <Button type="button" className="bg-[#0D3570] hover:bg-[#0a2a5c]" onClick={saveModule}>
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
