import { PONCTUELLE_OFFER_LABEL } from "@/lib/constants/ponctuelle-page-copy"
import type { FormationSearchSuggestion } from "@/lib/types/formation-search"

/** Périmètre de la liste affichée au focus (champ vide). */
export type SiteSearchDefaultScope = "all" | "certifications" | "ponctuelle" | "reconversion"

type TopicRow = { title?: string; href?: string }

function mapReconversionDefaults(rows: TopicRow[]): FormationSearchSuggestion[] {
  return rows
    .filter((x) => typeof x?.href === "string" && typeof x?.title === "string")
    .map((x) => ({
      id: `reconversion-default:${x.href}`,
      kind: "reconversion" as const,
      label: `${x.title} — reconversion professionnelle`,
      href: x.href!,
    }))
}

function mapPonctuelleDefaults(rows: TopicRow[]): FormationSearchSuggestion[] {
  return rows
    .filter((x) => typeof x?.href === "string" && typeof x?.title === "string")
    .map((x) => ({
      id: `ponctuelle-default:${x.href}`,
      kind: "ponctuelle" as const,
      label: `${x.title} — ${PONCTUELLE_OFFER_LABEL}`,
      href: x.href!,
    }))
}

function mapCertificationCategoryDefaults(cats: string[]): FormationSearchSuggestion[] {
  return cats.map((c) => ({
    id: `cert-category:${c}`,
    kind: "certification_category" as const,
    label: `${c} — certification`,
    href: `/certifications?${new URLSearchParams({ formation: c }).toString()}`,
  }))
}

export async function loadSiteSearchDefaultSuggestions(
  scope: SiteSearchDefaultScope,
): Promise<FormationSearchSuggestion[]> {
  if (scope === "certifications") {
    const catRes = await fetch("/api/certification-categories")
    const catJson = (await catRes.json()) as { categories?: string[] }
    const cats = Array.isArray(catJson.categories) ? catJson.categories : []
    return mapCertificationCategoryDefaults(cats)
  }

  const topicRes = await fetch("/api/formation-topic-cards")
  const json = (await topicRes.json()) as {
    reconversion?: TopicRow[]
    ponctuelle?: TopicRow[]
  }
  const rc = Array.isArray(json.reconversion) ? json.reconversion : []
  const po = Array.isArray(json.ponctuelle) ? json.ponctuelle : []

  if (scope === "reconversion") return mapReconversionDefaults(rc)
  if (scope === "ponctuelle") return mapPonctuelleDefaults(po)

  if (scope === "all") {
    const catRes = await fetch("/api/certification-categories")
    const catJson = (await catRes.json()) as { categories?: string[] }
    const cats = Array.isArray(catJson.categories) ? catJson.categories : []
    return [
      ...mapReconversionDefaults(rc),
      ...mapPonctuelleDefaults(po),
      ...mapCertificationCategoryDefaults(cats),
    ]
  }

  return []
}
