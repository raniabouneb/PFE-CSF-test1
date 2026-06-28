import {
  sanitizeFormationTopicCardsPayload,
  sanitizePonctuelleTopicHref,
  sanitizeReconversionTopicHref,
  type FormationTopicCardItem,
} from "@/lib/formation-topic-cards-shared"
import { fetchPublicApi } from "@/lib/server/api-client"

type HeroWithBackground = {
  title: string
  subtitle: string
  backgroundImageUrl?: string | null
}

type PageWithHero = {
  slug: string
  hero: HeroWithBackground
}

async function loadTopicCards(): Promise<{
  reconversion: FormationTopicCardItem[]
  ponctuelle: FormationTopicCardItem[]
} | null> {
  const data = await fetchPublicApi<{
    reconversion: FormationTopicCardItem[]
    ponctuelle: FormationTopicCardItem[]
  }>("/api/v1/formation/topic-cards")
  return sanitizeFormationTopicCardsPayload(data)
}

function hrefEndsWithSlug(href: string, slug: string): boolean {
  const s = slug.trim()
  if (!s) return false
  const normalized = href.replace(/\/$/, "")
  return (
    normalized.endsWith(`/${encodeURIComponent(s)}`) ||
    normalized.endsWith(`/${s}`) ||
    decodeURIComponent(normalized.split("/").pop() ?? "") === s
  )
}

function findTopicCardImage(
  cards: FormationTopicCardItem[],
  slug: string,
  sanitizeHref: (href: string) => string,
): string | null {
  const match = cards.find((c) => hrefEndsWithSlug(sanitizeHref(c.href), slug))
  const img = match?.image?.trim()
  return img || null
}

/** Aligne le hero sur l’image de la carte thématique `/formation` (même champ BD). */
export async function mergeTopicCardHeroImage<T extends PageWithHero>(
  data: T,
  kind: "reconversion" | "ponctuelle",
): Promise<T> {
  const cards = await loadTopicCards()
  if (!cards) return data

  const list = kind === "reconversion" ? cards.reconversion : cards.ponctuelle
  const sanitize = kind === "reconversion" ? sanitizeReconversionTopicHref : sanitizePonctuelleTopicHref
  const image = findTopicCardImage(list, data.slug, sanitize)
  if (!image) return data

  return {
    ...data,
    hero: {
      ...data.hero,
      backgroundImageUrl: image,
    },
  }
}
