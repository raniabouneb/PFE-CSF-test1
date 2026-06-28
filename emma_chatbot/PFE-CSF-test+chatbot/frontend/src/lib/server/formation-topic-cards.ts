import { fetchPublicApi } from "@/lib/server/api-client"
import { getBackendUrl } from "@/lib/server/backend"
import {
  sanitizeFormationTopicCardsPayload,
  type FormationTopicCardItem,
} from "@/lib/formation-topic-cards-shared"

export type { FormationTopicCardItem }

type ApiPayload = {
  reconversion: FormationTopicCardItem[]
  ponctuelle: FormationTopicCardItem[]
}

/** Données pour les grilles de cartes sur /formation (sections reconversion & ponctuelle). */
export async function getFormationTopicCardsForFormats(): Promise<{
  reconversion: FormationTopicCardItem[]
  ponctuelle: FormationTopicCardItem[]
} | null> {
  try {
    const data = await fetchPublicApi<ApiPayload | null>("/api/v1/formation/topic-cards")
    if (data === null) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[formation/topic-cards] API null ou erreur — grilles statiques sur /formation. Vérifiez que le backend tourne et BACKEND_URL (défaut:",
          `${getBackendUrl()}).`,
        )
      }
      return null
    }
    return sanitizeFormationTopicCardsPayload(data)
  } catch (error) {
    console.error("formation_topic_cards: API échouée, fallback contenu statique:", error)
    return null
  }
}
