import { slugFingerprint } from "@/lib/slug-fingerprint"

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

/** Détail d’une formation à la carte (slug en base : `ponctuelle_formation.slug`). */
export function formationPonctuelleDetailHref(slug: string | null | undefined): string {
  const s = (slug ?? "").trim()
  if (!s || ["null", "none", "undefined"].includes(s.toLowerCase())) {
    return FORMATIONS_PONCTUELLES_HREF
  }
  const seg =
    slugFingerprint(s) ||
    s
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
  return `${FORMATIONS_PONCTUELLES_HREF}/${encodeURIComponent(seg)}`
}

/** Sous-pages reconversion (cartes depuis /formation) */
export const formationReconversionHref = {
  systemeEmbarque: "/formation/reconversion/systeme-embarque",
  fullStack: "/formation/reconversion/full-stack",
  testeurLogiciel: "/formation/reconversion/testeur-logiciel",
} as const
