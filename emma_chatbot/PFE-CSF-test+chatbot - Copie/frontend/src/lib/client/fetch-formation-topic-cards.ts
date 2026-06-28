import { getPublicBackendUrl } from "@/lib/client-public-backend"
import {
  sanitizeFormationTopicCardsPayload,
  type FormationTopicCardsPayload,
} from "@/lib/formation-topic-cards-shared"

/**
 * 1) Route Next `/api/formation-topic-cards` (même logique que le SSR).
 * 2) Si vide ou erreur : GET direct vers FastAPI (CORS déjà ouvert sur :3000 / :3001).
 *    Utile quand le fetch serveur Next → 127.0.0.1:8010 échoue (IPv6, timing, etc.).
 */
export async function fetchFormationTopicCardsWithFallback(): Promise<FormationTopicCardsPayload | null> {
  const tryParse = async (res: Response): Promise<FormationTopicCardsPayload | null> => {
    if (!res.ok) return null
    try {
      const raw = (await res.json()) as FormationTopicCardsPayload
      return sanitizeFormationTopicCardsPayload(raw)
    } catch {
      return null
    }
  }

  try {
    const r1 = await fetch("/api/formation-topic-cards", {
      cache: "no-store",
    })
    const fromNext = await tryParse(r1)
    if (fromNext) return fromNext
  } catch {
    /* suite */
  }

  try {
    const base = getPublicBackendUrl()
    const r2 = await fetch(`${base}/api/v1/formation/topic-cards`, {
      cache: "no-store",
    })
    return await tryParse(r2)
  } catch {
    return null
  }
}
