import type {
  PonctuelleFormationPageData,
  PonctuelleModuleCard,
  PonctuelleModuleListItem,
  PonctuelleModulesCatalogData,
} from "@/lib/types/ponctuelle"
import { sortPonctuelleModulesByTitle } from "@/lib/sort-ponctuelle-module-list"
import { getBackendUrl } from "@/lib/server/backend"
import { fetchPublicApi } from "@/lib/server/api-client"

/** Supabase distant : la 1re requête peut dépasser 20s en dev local. */
const FETCH_TIMEOUT_MS = 180_000

function filterCatalogModules(
  catalog: PonctuelleModulesCatalogData,
  q: string,
): PonctuelleModuleListItem[] {
  const term = q.trim().toLowerCase()
  return (catalog.modules ?? [])
    .filter((m) => !term || (m.title ?? "").toLowerCase().includes(term))
    .map((m) => ({
      id: m.id,
      title: m.title,
      formationSlug: m.formationSlug ?? "",
      formationTitle: m.formationTitle ?? "",
    }))
}

async function fetchModulesSearchFromBackend(q: string): Promise<{
  modules: PonctuelleModuleListItem[] | null
  notFound: boolean
}> {
  const params = new URLSearchParams()
  if (q.trim()) params.set("q", q.trim())
  const path = `/api/v1/ponctuelle/modules/search${params.toString() ? `?${params}` : ""}`
  const url = `${getBackendUrl()}${path}`

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.status === 404) {
      return { modules: null, notFound: true }
    }
    if (!res.ok) {
      return { modules: null, notFound: false }
    }
    const data = (await res.json()) as { modules?: PonctuelleModuleListItem[] }
    return {
      modules: Array.isArray(data.modules) ? data.modules : [],
      notFound: false,
    }
  } catch {
    return { modules: null, notFound: false }
  }
}

/** Repli si `/ponctuelle/modules/catalog` absent (backend non redémarré) ou vide. */
async function fetchCatalogViaFormationsFallback(): Promise<PonctuelleModulesCatalogData> {
  const formations = await fetchPublicApi<{ slug: string; title: string }[]>(
    "/api/v1/ponctuelle/formations",
  )
  if (!formations?.length) return { modules: [] }

  const modules: PonctuelleModuleCard[] = []

  for (const f of formations) {
    const detail = await fetchPublicApi<PonctuelleFormationPageData>(
      `/api/v1/ponctuelle/formations/${encodeURIComponent(f.slug)}`,
    )
    if (!detail?.modules?.length) continue
    const formationTitle = detail.hero?.title ?? f.title
    for (const mod of detail.modules) {
      modules.push({
        ...mod,
        formationSlug: f.slug,
        formationTitle,
      })
    }
  }

  return { modules }
}

async function searchViaFormationsFallback(q: string): Promise<PonctuelleModuleListItem[]> {
  const formations = await fetchPublicApi<{ slug: string; title: string }[]>(
    "/api/v1/ponctuelle/formations",
  )
  if (!formations?.length) return []

  const term = q.trim().toLowerCase()
  const out: PonctuelleModuleListItem[] = []

  for (const f of formations) {
    const detail = await fetchPublicApi<PonctuelleFormationPageData>(
      `/api/v1/ponctuelle/formations/${encodeURIComponent(f.slug)}`,
    )
    if (!detail?.modules?.length) continue
    for (const mod of detail.modules) {
      if (term && !(mod.title ?? "").toLowerCase().includes(term)) continue
      out.push({
        id: mod.id,
        title: mod.title,
        formationSlug: f.slug,
        formationTitle: detail.hero?.title ?? f.title,
      })
    }
  }

  return out
}

export async function fetchPonctuelleModulesCatalog(): Promise<PonctuelleModulesCatalogData> {
  const data = await fetchPublicApi<PonctuelleModulesCatalogData>("/api/v1/ponctuelle/modules/catalog")
  if ((data?.modules?.length ?? 0) > 0) {
    return { modules: data!.modules }
  }
  return fetchCatalogViaFormationsFallback()
}

/** Liste modules ponctuels (recherche titre). Bascule sur catalog / formations si l'API search est absente. */
export async function searchPonctuelleModules(q: string): Promise<PonctuelleModuleListItem[]> {
  const { modules } = await fetchModulesSearchFromBackend(q)
  if (modules !== null) return sortPonctuelleModulesByTitle(modules)

  const fromCatalog = filterCatalogModules(await fetchPonctuelleModulesCatalog(), q)
  if (fromCatalog.length > 0) return sortPonctuelleModulesByTitle(fromCatalog)
  return sortPonctuelleModulesByTitle(await searchViaFormationsFallback(q))
}
