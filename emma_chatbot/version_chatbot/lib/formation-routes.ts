/** Paramètre d’URL pour ouvrir une section sur `/formation` */
export const FORMATION_OPEN_QUERY = "open" as const

export type FormationOpenSection = "reconversion" | "ponctuelle" | "parcours"

const VALID: FormationOpenSection[] = ["reconversion", "ponctuelle", "parcours"]

export function isFormationOpenSection(value: string | null): value is FormationOpenSection {
  return value !== null && VALID.includes(value as FormationOpenSection)
}

export function formationPageUrl(section: FormationOpenSection): string {
  return `/formation?${FORMATION_OPEN_QUERY}=${section}`
}

/** Page listes modules ponctuels */
export const FORMATIONS_PONCTUELLES_HREF = "/formations-ponctuelles"

/** Sous-pages reconversion (cartes depuis /formation) */
export const formationReconversionHref = {
  systemeEmbarque: "/formation/reconversion/systeme-embarque",
  fullStack: "/formation/reconversion/full-stack",
  testeurLogiciel: "/formation/reconversion/testeur-logiciel",
} as const
