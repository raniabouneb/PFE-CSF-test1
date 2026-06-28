import { cache } from "react"
import { collaborations, partners } from "@/lib/data/partners"
import { fetchPublicApi } from "@/lib/server/api-client"

/**
 * Données d’origine PostgreSQL (ex. Supabase, schéma `public`) — **implémenté côté FastAPI**, pas dans Next.
 *
 * Cartes « Nos Actualités » → table **`collaborations`** (pas de table « actualités ») :
 * `id`, `title`, `description`, `background_image` (URL Cloudinary ou chemin `/…` dans `public/`)
 * → le JSON expose `image` (l’API doit mapper `background_image` → `image`).
 *
 * Logos partenaires → table **`partner_logos`** :
 * `id`, `name`, `logo_path`, `is_active`, `sort_order` (…)
 * → le JSON expose `id`, `name`, `logo` (mapper `logo_path` → `logo`), tri par `sort_order` puis `id`.
 *
 * Endpoint consommé ici : `GET /api/v1/home/partners-data`
 *
 * **Logos (chaîne roulante)** : si l’API renvoie au moins un partenaire, on les utilise ; si le tableau est
 * vide (ou absent), repli comme pour les actualités : logos statiques `lib/data/partners.ts`.
 * Repli statique également si l’appel HTTP échoue ou renvoie null.
 */

/** Contrat JSON : GET /api/v1/home/partners-data */
export type HomePartnersCollaboration = {
  id: number
  title: string
  description: string
  image: string
}

export type HomePartnersPartner = {
  id: number
  name: string
  logo: string
}

export type HomePartnersPayload = {
  collaborations: HomePartnersCollaboration[]
  partners: HomePartnersPartner[]
  /** URL ou chemin `/images/…` — table PostgreSQL `home_page_hero` (id = 1). */
  heroBackgroundImage?: string | null
}

/**
 * Données page d’accueil (actualités + partenaires).
 * Fallback : `lib/data/partners.ts` si l’API renvoie null, erreur, ou tableaux vides.
 * Mis en cache par requête RSC pour éviter plusieurs appels HTTP si plusieurs composants consomment les mêmes données.
 */
async function loadHomePartnersData(): Promise<HomePartnersPayload> {
  try {
    const data = await fetchPublicApi<HomePartnersPayload>("/api/v1/home/partners-data", {
      revalidateSeconds: 120,
    })

    if (!data) {
      return { collaborations, partners }
    }

    const heroBg =
      typeof data.heroBackgroundImage === "string" && data.heroBackgroundImage.trim()
        ? data.heroBackgroundImage.trim()
        : null

    const partnersFromApi = Array.isArray(data.partners)
      ? data.partners.map((item) => ({
          id: item.id,
          name: item.name,
          logo: item.logo,
        }))
      : null

    /* Même idée que `collaborations` : tableau vide depuis la BD → pas de marquee silencieux,
     * retour aux logos statiques (avant ils disparaissaient si l’API renvoyait `partners: []`). */
    const partnersResolved =
      partnersFromApi && partnersFromApi.length > 0 ? partnersFromApi : partners

    return {
      heroBackgroundImage: heroBg,
      collaborations:
        data.collaborations.length > 0
          ? data.collaborations.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              image: item.image,
            }))
          : collaborations,
      partners: partnersResolved,
    }
  } catch (error) {
    console.error("getHomePartnersData — fallback statique:", error)
    return { collaborations, partners }
  }
}

export const getHomePartnersData = cache(loadHomePartnersData)
