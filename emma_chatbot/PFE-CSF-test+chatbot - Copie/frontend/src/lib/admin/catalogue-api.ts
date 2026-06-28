/**
 * Client catalogue admin — relais cookie session via `/api/admin/backend/*`.
 */

const PROXY = "/api/admin/backend"

export type CatalogueFilterOption = { id: string; label: string }

export type CatalogueSupportPdf = {
  id: string
  fileName: string
  url: string
}

export type CatalogueModuleDto = {
  id: string
  displayCode: string
  titre: string
  description: string
  imageUrl?: string | null
  format: "reconversion" | "ponctuelle" | "sur_mesure"
  segmentSlug: string | null
  segmentLabel: string | null
  reconversionPackId: string | null
  reconversionPackLabel: string | null
  dureeHeures: number
  nombreLabs: number
  examen: boolean
  durationText?: string | null
  practiceText?: string | null
  projectText?: string | null
  evaluationText?: string | null
  supportsPdf: CatalogueSupportPdf[]
}

export type CatalogueFiltersPayload = {
  formats: CatalogueFilterOption[]
  reconversionTopics: CatalogueFilterOption[]
  reconversionPacks: {
    id: string
    label: string
    topicSlug: string
    variantSlug: string
    packKind: "full" | "mini" | string
  }[]
  ponctuelleFormations: CatalogueFilterOption[]
  kpis: { modules: number; supports: number; totalHours: number }
}

export type CatalogueModulesPayload = {
  items: CatalogueModuleDto[]
  total: number
  page: number
  pageSize: number
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown; error?: unknown }
    if (typeof j.detail === "string") return j.detail
    if (Array.isArray(j.detail) && j.detail[0] && typeof j.detail[0] === "object") {
      const msg = (j.detail[0] as { msg?: string }).msg
      if (typeof msg === "string") return msg
    }
    if (typeof j.error === "string") return j.error
  } catch {
    /* ignore */
  }
  return `Erreur ${res.status}`
}

export async function fetchCatalogueFilters(): Promise<CatalogueFiltersPayload> {
  const res = await fetch(`${PROXY}/catalogue/filters`, { credentials: "include", cache: "no-store" })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as CatalogueFiltersPayload
}

export async function fetchCatalogueModules(params: {
  format?: string
  segment?: string
  reconversionPackId?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<CatalogueModulesPayload> {
  const sp = new URLSearchParams()
  if (params.format && params.format !== "all") sp.set("format", params.format)
  if (params.segment && params.segment !== "all") sp.set("segment", params.segment)
  if (params.reconversionPackId && params.reconversionPackId !== "all") {
    sp.set("reconversionPackId", params.reconversionPackId)
  }
  if (params.search?.trim()) sp.set("search", params.search.trim())
  sp.set("page", String(params.page ?? 1))
  sp.set("pageSize", String(params.pageSize ?? 200))
  const res = await fetch(`${PROXY}/catalogue/modules?${sp.toString()}`, {
    credentials: "include",
    cache: "no-store",
  })
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as CatalogueModulesPayload
}

export async function createCatalogueModule(body: Record<string, unknown>): Promise<CatalogueModuleDto> {
  const res = await fetch(`${PROXY}/catalogue/modules`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { module: CatalogueModuleDto }
  return data.module
}

export async function patchCatalogueModule(
  moduleId: string,
  body: Record<string, unknown>,
): Promise<CatalogueModuleDto> {
  const res = await fetch(`${PROXY}/catalogue/modules/${encodeURIComponent(moduleId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { module: CatalogueModuleDto }
  return data.module
}

export async function deleteCatalogueModule(moduleId: string): Promise<void> {
  const res = await fetch(`${PROXY}/catalogue/modules/${encodeURIComponent(moduleId)}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error(await readError(res))
}

export async function uploadModuleSupportPdf(moduleId: string, file: File): Promise<CatalogueSupportPdf> {
  const fd = new FormData()
  fd.set("file", file)
  const res = await fetch(`${PROXY}/catalogue/modules/${encodeURIComponent(moduleId)}/supports`, {
    method: "POST",
    credentials: "include",
    body: fd,
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { support: CatalogueSupportPdf }
  return data.support
}

export async function deleteModuleSupportPdf(moduleId: string, supportId: string): Promise<void> {
  const res = await fetch(
    `${PROXY}/catalogue/modules/${encodeURIComponent(moduleId)}/supports/${encodeURIComponent(supportId)}`,
    { method: "DELETE", credentials: "include" },
  )
  if (!res.ok) throw new Error(await readError(res))
}

export type PonctuelleFormationModule = {
  id: string
  title: string
  description: string
  imageUrl: string
  duration: string
  practice: string
  project: string
  evaluation: string
  hoverDetail: string | null
  isCertified: boolean
}

export type PonctuelleFormationDetail = {
  slug: string
  hero: { title: string; subtitle: string; backgroundImageUrl?: string }
  modules: PonctuelleFormationModule[]
}

export async function fetchPonctuelleFormationModules(
  slug: string,
): Promise<PonctuelleFormationDetail> {
  const res = await fetch(
    `${PROXY}/catalogue/ponctuelle-modules/${encodeURIComponent(slug)}`,
    { credentials: "include", cache: "no-store" },
  )
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as PonctuelleFormationDetail
}
