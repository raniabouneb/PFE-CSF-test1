import { getStaticSystemeEmbarqueData } from "@/lib/data/reconversion-fallback"
import type { ReconversionTopicPageData } from "@/lib/types/reconversion"
import { fetchPublicApi } from "@/lib/server/api-client"
import { getBackendUrl } from "@/lib/server/backend"
import { mergeTopicCardHeroImage } from "@/lib/server/merge-topic-card-hero-image"

async function fetchHorsPackModulesOnly(
  slug: string,
): Promise<ReconversionTopicPageData["horsPackModules"]> {
  const rows = await fetchPublicApi<ReconversionTopicPageData["horsPackModules"]>(
    `/api/v1/reconversion/topics/${encodeURIComponent(slug)}/hors-pack-modules`,
  )
  return rows ?? []
}

/**
 * Uniquement les données BD (pas de fallback statique).
 * Pour `/formation/reconversion/[slug]` : notFound si null.
 */
export async function fetchReconversionTopicFromDb(
  slug: string,
): Promise<ReconversionTopicPageData | null> {
  const data = await fetchPublicApi<ReconversionTopicPageData>(
    `/api/v1/reconversion/topics/${encodeURIComponent(slug)}/page-data`,
  )
  if (!data) return null
  return mergeTopicCardHeroImage(data, "reconversion")
}

/**
 * Données page reconversion : API en priorité, sinon fallback statique (systeme-embarque) ou squelette.
 */
export async function getReconversionTopicPageData(slug: string): Promise<ReconversionTopicPageData> {
  try {
    const fromApi = await fetchPublicApi<ReconversionTopicPageData>(
      `/api/v1/reconversion/topics/${encodeURIComponent(slug)}/page-data`,
    )
    if (fromApi) {
      return mergeTopicCardHeroImage(fromApi, "reconversion")
    }
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[reconversion] Pas de données API pour slug="${slug}". ` +
          `Backend attendu : ${getBackendUrl()}. ` +
          `Insérer le parcours en PostgreSQL (table reconversion_topic) ou alimenter la BD.`,
      )
    }
  } catch (e) {
    console.error("reconversion_topic: lecture API échouée:", e)
  }

  if (slug === "systeme-embarque") {
    const staticData = getStaticSystemeEmbarqueData()
    const horsPackModules = await fetchHorsPackModulesOnly("systeme-embarque")
    return { ...staticData, horsPackModules }
  }

  const placeholders: Record<string, { title: string; subtitle: string }> = {
    "full-stack": {
      title: "CSF-RCP – Développement Full-Stack",
      subtitle: "Formation professionnelle animée par des experts industriels.",
    },
    "testeur-logiciel": {
      title: "CSF-RCP – Académie en Testeur Logiciel",
      subtitle: "Formation professionnelle animée par des experts industriels.",
    },
  }

  const ph = placeholders[slug]
  return {
    slug,
    hero: {
      title: ph?.title ?? "Formation",
      subtitle: ph?.subtitle ?? "",
    },
    stats: [],
    fullPacks: [],
    miniPacks: [],
    packDetailModules: [],
    horsPackModules: [],
  }
}
