import type { PonctuelleModuleListItem } from "@/lib/types/ponctuelle"

export async function fetchPonctuelleModulesSearch(q: string): Promise<PonctuelleModuleListItem[]> {
  const params = new URLSearchParams()
  if (q.trim()) params.set("q", q.trim())
  const qs = params.toString()
  try {
    const res = await fetch(`/api/formation/ponctuelle-modules-search${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = (await res.json()) as { modules?: PonctuelleModuleListItem[] }
    return Array.isArray(data.modules) ? data.modules : []
  } catch {
    return []
  }
}

export function ponctuelleModuleCatalogHref(moduleId: string): string {
  return `/formations-ponctuelles#ponctuelle-module-${encodeURIComponent(moduleId)}`
}
