export type PonctuelleFormationListItem = { slug: string; title: string }

/** Données page `/formations-ponctuelles/[slug]` — aligné sur `ponctuelle_formations.get_ponctuelle_formation_by_slug` (FastAPI). */
export type PonctuelleFormationPageData = {
  slug: string
  hero: {
    title: string
    subtitle: string
    backgroundImageUrl?: string | null
  }
  modules: {
    id: string
    imageUrl: string
    title: string
    description: string
    duration?: string | null
    practice?: string | null
    project?: string | null
    evaluation?: string | null
    hoverDetail?: string | null
    isCertified: boolean
  }[]
}
