import type {
  PonctuelleFormationListItem,
  PonctuelleFormationPageData,
} from "@/lib/types/ponctuelle"
import { slugFingerprint } from "@/lib/slug-fingerprint"
import { fetchPublicApi } from "@/lib/server/api-client"

/** Segment d’URL `[slug]` → clé stable (empreinte), alignée sur `formationPonctuelleDetailHref` / FastAPI. */
export function normalizePonctuellePathSlug(segment: string): string {
  let t = (segment ?? "").trim().replace(/\+/g, " ")
  if (!t) return ""
  try {
    t = decodeURIComponent(t).trim()
  } catch {
    t = t.trim()
  }
  const fp = slugFingerprint(t)
  if (fp) return fp
  return t
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizePonctuelleSlugForApi(slug: string): string | null {
  const s = (slug ?? "").trim()
  if (!s || ["null", "none", "undefined"].includes(s.toLowerCase())) {
    return null
  }
  return s
}

export async function fetchPonctuelleFormationBySlug(
  slug: string,
): Promise<PonctuelleFormationPageData | null> {
  const s = normalizePonctuelleSlugForApi(normalizePonctuellePathSlug(slug))
  if (s === null) {
    return null
  }

  const direct = await fetchPublicApi<PonctuelleFormationPageData>(
    `/api/v1/ponctuelle/formations/${encodeURIComponent(s)}`,
  )
  if (direct) {
    return direct
  }

  /**
   * Repli : slug d’URL ≠ slug BD (accents, libellé carte) — on résout via la liste
   * (empreinte slug + titre hero comme côté FastAPI).
   */
  const list = await listPonctuelleFormations()
  const match = findPonctuelleListMatch(list, s)
  if (!match?.slug) {
    return null
  }
  /** Toujours réessayer avec le slug canonique renvoyé par la liste (même si identique à `s`). */
  return fetchPublicApi<PonctuelleFormationPageData>(
    `/api/v1/ponctuelle/formations/${encodeURIComponent(match.slug)}`,
  )
}

function findPonctuelleListMatch(
  list: PonctuelleFormationListItem[],
  raw: string,
): PonctuelleFormationListItem | undefined {
  const want = slugFingerprint(raw)
  for (const row of list) {
    if (slugFingerprint(row.slug) === want) {
      return row
    }
  }
  for (const row of list) {
    if (slugFingerprint(row.title) === want) {
      return row
    }
  }
  return undefined
}

export async function listPonctuelleFormations(): Promise<PonctuelleFormationListItem[]> {
  const rows = await fetchPublicApi<PonctuelleFormationListItem[]>("/api/v1/ponctuelle/formations")
  return rows ?? []
}
