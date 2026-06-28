export type PackModuleKind = "course" | "project"

export type ReconversionPackModuleDTO = {
  text: string
  kind: PackModuleKind
  /** Détails optionnels (même esprit que `ReconversionHorsPackModuleCard`). */
  description?: string | null
  imageUrl?: string | null
  duration?: string | null
  practice?: string | null
  project?: string | null
  evaluation?: string | null
}

export type ReconversionPackDTO = {
  variantSlug: string
  /** Couleurs / icônes : optimum | silver | gold | microcontroller | processor */
  styleKey: string
  tabLabel: string
  badgeLabel: string
  cardTitle: string
  imageUrl: string
  modules: ReconversionPackModuleDTO[]
}

export type ReconversionStatDTO = {
  label: string
  value: string
  description?: string
}

/** Carte « module hors pack » : `ponctuelle_module` lié au même `slug` que `ponctuelle_formation` (voir `hors_pack.py`). */
export type ReconversionHorsPackModuleCard = {
  id: string
  title: string
  kind: PackModuleKind
  imageUrl: string
  description: string
  duration?: string | null
  practice?: string | null
  project?: string | null
  evaluation?: string | null
  hoverDetail?: string | null
  certified?: boolean
}

/** Aligné sur `GET /api/v1/reconversion/topics/{slug}/page-data` (`load_reconversion_topic_from_db`). */
export type ReconversionTopicPageData = {
  slug: string
  hero: {
    title: string
    subtitle: string
    backgroundImageUrl?: string | null
  }
  stats: ReconversionStatDTO[]
  fullPacks: ReconversionPackDTO[]
  miniPacks: ReconversionPackDTO[]
  /**
   * Modules du parcours « full » `styleKey === "gold"` (`reconversion_pack_module`), section « Les modules en détails ».
   * Absent si l’API est une ancienne version : traiter comme `[]`.
   */
  packDetailModules?: ReconversionHorsPackModuleCard[]
  horsPackModules: ReconversionHorsPackModuleCard[]
}
