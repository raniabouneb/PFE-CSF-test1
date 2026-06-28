import type { PonctuelleModuleListItem } from "@/lib/types/ponctuelle"

/** Tri A→Z sur le titre (section Formation par module, recherche, etc.). */
export function sortPonctuelleModulesByTitle(
  modules: PonctuelleModuleListItem[],
): PonctuelleModuleListItem[] {
  return [...modules].sort((a, b) =>
    (a.title ?? "").localeCompare(b.title ?? "", "fr", { sensitivity: "base" }),
  )
}
