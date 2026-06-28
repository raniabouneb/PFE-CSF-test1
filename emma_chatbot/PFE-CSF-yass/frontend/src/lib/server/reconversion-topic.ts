import { getStaticSystemeEmbarqueData } from "@/lib/data/reconversion-fallback"
import type { ReconversionTopicPageData } from "@/lib/types/reconversion"
import { fetchPublicApi } from "@/lib/server/api-client"
import { getBackendUrl } from "@/lib/server/backend"

const SYSTEME_EMBARQUE_FULL_PACK_IMAGES = [
  "/images/pack/image1.jpeg",
  "/images/pack/image3-1.jpg",
  "/images/pack/image6.jpg",
]

const SYSTEME_EMBARQUE_MINI_PACK_IMAGES = [
  "/images/pack/kkk.jpeg",
  "/images/pack/whatsapp-03.jpeg",
]
const SYSTEME_EMBARQUE_PACK_DETAIL_IMAGE = "/images/pack/image6.jpg"
const SYSTEME_EMBARQUE_HERO_IMAGE = "/images/pack/whatsapp-0.jpeg"
const SYSTEME_EMBARQUE_IMAGE_POOL = [
  "/images/pack/image1.jpeg",
  "/images/pack/image3-1.jpg",
  "/images/pack/image6.jpg",
  "/images/pack/kkk.jpeg",
  "/images/pack/whatsapp-03.jpeg",
  "/images/pack/whatsapp-0.jpeg",
]

function pickFromPool(index: number): string {
  return SYSTEME_EMBARQUE_IMAGE_POOL[index % SYSTEME_EMBARQUE_IMAGE_POOL.length]
}

function withSystemeEmbarquePackImages(
  data: ReconversionTopicPageData,
): ReconversionTopicPageData {
  return {
    ...data,
    hero: {
      ...data.hero,
      backgroundImageUrl: SYSTEME_EMBARQUE_HERO_IMAGE,
    },
    fullPacks: (data.fullPacks ?? []).map((pack, index) => ({
      ...pack,
      imageUrl: SYSTEME_EMBARQUE_FULL_PACK_IMAGES[index] ?? pickFromPool(index),
    })),
    miniPacks: (data.miniPacks ?? []).map((pack, index) => ({
      ...pack,
      imageUrl: SYSTEME_EMBARQUE_MINI_PACK_IMAGES[index] ?? pickFromPool(index + 3),
    })),
    packDetailModules: (data.packDetailModules ?? []).map((module) => ({
      ...module,
      // Ne remplace pas l'image BD si elle existe : fallback seulement si vide / absent.
      imageUrl: (module.imageUrl ?? "").trim() || SYSTEME_EMBARQUE_PACK_DETAIL_IMAGE,
    })),
    horsPackModules: (data.horsPackModules ?? []).map((module, index) => ({
      ...module,
      // Même logique : si la BD fournit une image, on la garde.
      imageUrl: (module.imageUrl ?? "").trim() || pickFromPool(index),
    })),
  }
}

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
  return slug === "systeme-embarque" ? withSystemeEmbarquePackImages(data) : data
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
      return slug === "systeme-embarque" ? withSystemeEmbarquePackImages(fromApi) : fromApi
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
    return withSystemeEmbarquePackImages({ ...staticData, horsPackModules })
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
