import { fetchPublicApi } from "@/lib/server/api-client"
import { getBackendUrl } from "@/lib/server/backend"

export type CertificationIconKey = "cpu" | "globe" | "barchart"

export type CertificationsHeroStat = { value: string; label: string }

export type CertificationCardItem = {
  id: string
  /** Id module `ponctuelle_module` si la carte est liée à un module */
  moduleId?: string
  /** Slug de la section / filtre (ex. full-stack) */
  formationSlug?: string
  category: string
  title: string
  subtitle: string
  description: string
  skills: string[]
  iconKey: CertificationIconKey
  /** Visuel module (souvent Cloudinary) */
  imageUrl?: string
  isCertified?: boolean
  createdAt?: string
  sortOrder?: number
  /** Colonnes ajoutées dans Supabase : exposées en camelCase par l’API */
  [key: string]: unknown
}

export type CertificationFormationSection = {
  slug: string
  title: string
  cards: CertificationCardItem[]
}

/** Textes UI hors BD (non fournis par l’API pour le hero). */
const STATIC_HERO_EXTRAS = {
  description:
    "Valorisez votre expertise avec des certifications reconnues par l'industrie. Formez-vous à votre rythme et obtenez des accréditations vérifiables qui font la différence dans votre carrière.",
  searchPlaceholder: "Rechercher une certification...",
  sectionTitle: "Nos Certifications",
  sectionSubtitle:
    "Explorez notre catalogue complet de certifications professionnelles reconnues",
} as const

export type CertificationsPageData = {
  hero: {
    title: string
    subtitle: string
    backgroundImage: string
    stats: CertificationsHeroStat[]
    description: string
    searchPlaceholder: string
    sectionTitle: string
    sectionSubtitle: string
  }
  /**
   * Filtres = une entrée par `ponctuelle_slug` (topic-cards). Pas de bouton pour « Autres » ni
   * pour d’anciennes sections API : leurs cartes vont dans `orphanCards` (visibles sous « Tous »).
   */
  sections: CertificationFormationSection[]
  /** Cartes hors slugs topic-card : affichées uniquement avec le filtre « Tous ». */
  orphanCards: CertificationCardItem[]
}

const DEFAULT_STATS: CertificationsHeroStat[] = [
  { value: "24+", label: "Certifications" },
  { value: "4 800+", label: "Certifiés" },
  { value: "96%", label: "Taux de Réussite" },
]

const FALLBACK: CertificationsPageData = {
  hero: {
    title: "Certifications",
    subtitle: "Professionnelles",
    backgroundImage: "/images/certif.jpg",
    stats: DEFAULT_STATS,
    ...STATIC_HERO_EXTRAS,
  },
  sections: [],
  orphanCards: [],
}

/** Carte au format plat (ancien contrat : `GET /certifications/page` renvoyait `cards` sans `sections`). */
type ApiLegacyFlatCard = {
  id: string | number
  category?: string
  title: string
  subtitle: string
  description: string
  skills: string[]
  iconKey?: string
  moduleId?: string
  formationSlug?: string
  imageUrl?: string
  isCertified?: boolean
}

type ApiCertificationsResponse = {
  hero: {
    title: string
    subtitle: string
    backgroundImage: string
    stats: CertificationsHeroStat[]
  } | null
  /** Contrat actuel : une section par formation ponctuelle. */
  sections?: {
    slug: string
    title: string
    cards: (Omit<CertificationCardItem, "iconKey" | "formationSlug"> & {
      iconKey?: string
      formationSlug?: string
    })[]
  }[]
  /** Ancien contrat : liste plate (ex. table `certification_card` uniquement). */
  cards?: ApiLegacyFlatCard[]
  /** Métadonnées API : `revision` 2 = pas d’écriture certification sur les GET. */
  meta?: {
    syncFromModulesOk?: boolean
    revision?: number
    readOnlyOnGet?: boolean
  }
}

function mergeHeroFromApi(
  hero: NonNullable<ApiCertificationsResponse["hero"]>,
): CertificationsPageData["hero"] {
  const apiStatsRaw =
    Array.isArray(hero.stats) && hero.stats.length > 0 ? hero.stats : DEFAULT_STATS
  // On retire la stat "Support Réactif" (carte 48h) si elle existe.
  const stats = apiStatsRaw.filter(
    (s) => String(s.label || "").trim().toLowerCase() !== "support réactif",
  )
  return {
    title: hero.title,
    subtitle: hero.subtitle,
    backgroundImage: hero.backgroundImage,
    stats,
    ...STATIC_HERO_EXTRAS,
  }
}

function assertIconKey(k: string): CertificationIconKey {
  if (k === "cpu" || k === "globe" || k === "barchart") return k
  return "globe"
}

function slugFromCategoryLabel(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return base || `cert-${index}`
}

/** Regroupe les cartes plates par `category` → sections (filtres + grille). */
function sectionsFromLegacyRootCards(raw: ApiLegacyFlatCard[]): CertificationFormationSection[] {
  const groups = new Map<string, ApiLegacyFlatCard[]>()
  for (const c of raw) {
    const key = (c.category || "Certifications").trim() || "Certifications"
    const list = groups.get(key) ?? []
    list.push(c)
    groups.set(key, list)
  }
  let i = 0
  const out: CertificationFormationSection[] = []
  for (const [title, cards] of groups) {
    const slug = slugFromCategoryLabel(title, i)
    i += 1
    out.push({
      slug,
      title,
      cards: cards.map((c) => {
        const iconKey = assertIconKey(String(c.iconKey ?? "globe"))
        return {
          id: String(c.id),
          moduleId: c.moduleId ?? undefined,
          formationSlug: c.formationSlug ?? slug,
          category: c.category || title,
          title: c.title,
          subtitle: c.subtitle,
          description: c.description,
          skills: Array.isArray(c.skills) ? c.skills : [],
          iconKey,
          imageUrl: c.imageUrl ?? undefined,
          isCertified: c.isCertified ?? undefined,
        }
      }),
    })
  }
  return out
}

function normalizeSections(
  raw: ApiCertificationsResponse["sections"],
): CertificationFormationSection[] {
  if (!Array.isArray(raw)) return []
  return raw.map((sec) => ({
    slug: sec.slug,
    title: sec.title,
    cards: (sec.cards ?? []).map((c): CertificationCardItem => {
      const iconKey = assertIconKey(String(c.iconKey ?? "globe"))
      return {
        id: String(c.id),
        moduleId: c.moduleId != null ? String(c.moduleId) : undefined,
        formationSlug: c.formationSlug ?? sec.slug,
        category: String(c.category ?? ""),
        title: String(c.title ?? ""),
        subtitle: String(c.subtitle ?? ""),
        description: String(c.description ?? ""),
        skills: Array.isArray(c.skills) ? c.skills.map(String) : [],
        iconKey,
        imageUrl: typeof c.imageUrl === "string" ? c.imageUrl : undefined,
        isCertified: typeof c.isCertified === "boolean" ? c.isCertified : undefined,
      }
    }),
  }))
}

/** Extrait le slug depuis `/formations-ponctuelles/mon-slug` (même contrat que l’API formation). */
function slugFromPonctuelleHref(href: string): string {
  const m = href.match(/\/formations-ponctuelles\/([^/?#]+)/)
  return m ? decodeURIComponent(m[1]) : ""
}

type TopicCardsPayload = {
  ponctuelle?: { title: string; href: string; ponctuelleSlug?: string | null }[]
} | null

/** Onglets filtres = lignes ponctuelles de `formation_topic_card` (slug BD prioritaire). */
async function sectionsFromFormationTopicCards(): Promise<CertificationFormationSection[]> {
  const topic = await fetchPublicApi<TopicCardsPayload>("/api/v1/formation/topic-cards")
  const ponctuelle = topic?.ponctuelle ?? []
  const seen = new Set<string>()
  const out: CertificationFormationSection[] = []
  ponctuelle.forEach((p, i) => {
    /** Même clé que `certification_card.category` (slug topic ou titre si slug NULL). */
    const filterKey = (p.ponctuelleSlug ?? "").trim()
    const fromHref = slugFromPonctuelleHref(p.href)
    const slug = filterKey || fromHref || `ponctuelle-${i}`
    if (seen.has(slug)) return
    seen.add(slug)
    out.push({ slug, title: p.title, cards: [] })
  })
  return out
}

/**
 * Boutons filtres = **uniquement** `topicTabs` (formation_topic_card / ponctuelle_slug).
 * Cartes API pour slugs inconnus ou section `autres` → `orphanCards` (pas de bouton dédié).
 */
function mergeSectionsWithTopicTabs(
  apiSections: CertificationFormationSection[],
  topicTabs: CertificationFormationSection[],
): { sections: CertificationFormationSection[]; orphanCards: CertificationCardItem[] } {
  if (topicTabs.length === 0) {
    /*
     * Topic-cards indisponible ou vide : on affiche quand même filtres + cartes depuis
     * GET /certifications/page (sinon seul « Tous » et aucune carte si le merge vidait tout).
     */
    if (apiSections.length > 0) {
      const autres = apiSections.find((s) => s.slug === "autres")
      const rest = apiSections.filter((s) => s.slug !== "autres")
      return {
        sections: rest,
        orphanCards: autres?.cards ?? [],
      }
    }
    return { sections: [], orphanCards: [] }
  }

  const bySlug = new Map(apiSections.map((s) => [s.slug, s]))
  const topicSlugs = new Set(topicTabs.map((t) => t.slug))

  const sections: CertificationFormationSection[] = topicTabs.map((t) => ({
    slug: t.slug,
    title: t.title,
    cards: bySlug.get(t.slug)?.cards ?? [],
  }))

  const orphanCards: CertificationCardItem[] = []
  for (const s of apiSections) {
    if (s.slug === "autres" || !topicSlugs.has(s.slug)) {
      orphanCards.push(...s.cards)
    }
  }

  const countMerged =
    sections.reduce((n, s) => n + s.cards.length, 0) + orphanCards.length
  const countApi = apiSections.reduce((n, s) => n + s.cards.length, 0)
  /** Si les slugs topic-cards et sections API ne correspondent pas du tout, on évite une grille vide. */
  if (countApi > 0 && countMerged === 0) {
    return mergeSectionsWithTopicTabs(apiSections, [])
  }

  return { sections, orphanCards }
}

/** Données page `/certifications` via `GET /api/v1/certifications/page`. */
export async function getCertificationsPageData(): Promise<CertificationsPageData> {
  const [data, topicTabs] = await Promise.all([
    fetchPublicApi<ApiCertificationsResponse | null>("/api/v1/certifications/page"),
    sectionsFromFormationTopicCards(),
  ])

  let apiSections = normalizeSections(data?.sections ?? [])

  /* Ancienne API : `{ hero, cards: [...] }` sans `sections` — alimenter le merge / orphans. */
  if (
    apiSections.length === 0 &&
    data?.cards &&
    Array.isArray(data.cards) &&
    data.cards.length > 0
  ) {
    apiSections = sectionsFromLegacyRootCards(data.cards)
  }

  const merged = mergeSectionsWithTopicTabs(apiSections, topicTabs)
  const sections = merged.sections
  let orphanCards = merged.orphanCards

  if (process.env.NODE_ENV === "development") {
    if (data?.meta?.syncFromModulesOk === false) {
      console.warn(
        "[certifications] syncFromModulesOk=false côté API. Vérifiez DATABASE_URL backend et les logs FastAPI.",
      )
    }
    if (data?.meta?.revision !== 2) {
      console.warn(
        `[certifications] L’API ne renvoie pas meta.revision=2 (reçu: ${String(data?.meta?.revision)}). ` +
          `Le frontend pointe peut‑être vers un autre backend : vérifiez BACKEND_URL (${process.env.BACKEND_URL || "non défini"}) ` +
          `et ouvrez ${getBackendUrl()}/api/v1/certifications/debug`,
      )
    }
  }

  if (topicTabs.length === 0) {
    if (
      orphanCards.length === 0 &&
      data?.cards &&
      Array.isArray(data.cards) &&
      data.cards.length > 0
    ) {
      orphanCards = sectionsFromLegacyRootCards(data.cards).flatMap((s) => s.cards)
    }
  }

  if (!data) {
    return {
      hero: { ...FALLBACK.hero },
      sections,
      orphanCards,
    }
  }

  if (data.hero) {
    return {
      hero: mergeHeroFromApi(data.hero),
      sections,
      orphanCards,
    }
  }

  return {
    hero: { ...FALLBACK.hero },
    sections,
    orphanCards,
  }
}
