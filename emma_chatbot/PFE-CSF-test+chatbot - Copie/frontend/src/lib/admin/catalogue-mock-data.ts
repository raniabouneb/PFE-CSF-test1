/**
 * Données de démo — catalogue modules (56). Remplacer par API admin catalogue.
 */

export type ModuleFormat = "reconversion" | "ponctuelle" | "sur_mesure"

/** Parcours Reconversion (3). */
export type ReconversionParcoursId = "embarque" | "fullstack" | "test_logiciel"

export const RECONVERSION_PARCOURS: Record<ReconversionParcoursId, string> = {
  embarque: "Système embarqué",
  fullstack: "Full stack",
  test_logiciel: "Test logiciel",
}

export const RECONVERSION_PARCOURS_LIST: { id: ReconversionParcoursId; label: string }[] = (
  Object.entries(RECONVERSION_PARCOURS) as [ReconversionParcoursId, string][]
).map(([id, label]) => ({ id, label }))

/** Domaines Ponctuelle (6). */
export type PonctuelleDomainId =
  | "dev"
  | "data_ia"
  | "cloud"
  | "cyber"
  | "management"
  | "design_ux"

export const PONCTUELLE_DOMAINES: { id: PonctuelleDomainId; label: string }[] = [
  { id: "dev", label: "Développement & ingénierie" },
  { id: "data_ia", label: "Data & intelligence artificielle" },
  { id: "cloud", label: "Cloud & infrastructure" },
  { id: "cyber", label: "Cybersécurité" },
  { id: "management", label: "Management & conduite du changement" },
  { id: "design_ux", label: "Design & expérience utilisateur" },
]

export function labelPonctuelleDomain(id: PonctuelleDomainId): string {
  return PONCTUELLE_DOMAINES.find((d) => d.id === id)?.label ?? id
}

export type CatalogueModule = {
  id: string
  titre: string
  description: string
  format: ModuleFormat
  /** Renseigné si format = reconversion */
  reconversionParcours?: ReconversionParcoursId
  /** Renseigné si format = ponctuelle */
  ponctuelleDomaine?: PonctuelleDomainId
  dureeHeures: number
  nombreLabs: number
  examen: boolean
  /** Noms de fichiers PDF (démo — pas d’upload réel). */
  supportsPdf: string[]
}

export const MODULE_FORMAT_LABELS: Record<ModuleFormat, string> = {
  reconversion: "Reconversion",
  ponctuelle: "Ponctuelle",
  sur_mesure: "Sur mesure",
}

/** 3 KPI glass — même usage que le tableau de bord. */
export const CATALOGUE_KPI_DEFINITIONS: {
  id: string
  label: string
  sublabel: string
  value: string
  trend?: string
}[] = [
  {
    id: "modules",
    label: "Modules au catalogue",
    sublabel: "Référence officielle CSF",
    value: "56",
    trend: "Couverture nationale",
  },
  {
    id: "supports",
    label: "Supports PDF indexés",
    sublabel: "Ressources pédagogiques",
    value: "128",
    trend: "+12 vs trimestre précédent",
  },
  {
    id: "volume",
    label: "Volume pédagogique",
    sublabel: "Heures cumulées (modules)",
    value: "2 840 h",
    trend: "Moy. 51 h / module",
  },
]

const TOPICS = [
  "Fondamentaux Python",
  "Cloud & DevOps",
  "Cybersécurité",
  "Data & BI",
  "IA générative",
  "Gestion de projet agile",
  "Administration réseau",
  "Bases de données SQL",
  "Développement web full-stack",
  "Excel & automatisation",
  "Machine learning",
  "Soft skills management",
]

const ASPECTS = [
  "niveau débutant",
  "approfondissement",
  "certifiant",
  "atelier pratique",
  "parcours intensive",
  "module transversal",
]

const PARCOURS_ORDER: ReconversionParcoursId[] = ["embarque", "fullstack", "test_logiciel"]

function hash(i: number): number {
  return ((i * 7919) % 9973) / 9973
}

export function buildCatalogueModules(): CatalogueModule[] {
  const formats: ModuleFormat[] = ["reconversion", "ponctuelle", "sur_mesure"]
  const out: CatalogueModule[] = []
  for (let i = 1; i <= 56; i++) {
    const format = formats[(i - 1) % 3] as ModuleFormat
    const h = hash(i)
    const topic = TOPICS[(i - 1) % TOPICS.length]!
    const aspect = ASPECTS[Math.floor((i - 1) / TOPICS.length) % ASPECTS.length]!
    const dureeHeures = Math.round(16 + h * 72)
    const nombreLabs = Math.floor(h * 9)
    const examen = h > 0.35
    const nPdf = Math.floor(h * 4)
    const supportsPdf =
      nPdf === 0
        ? []
        : Array.from({ length: nPdf }, (_, j) => `support-mod${i}-${j + 1}.pdf`)

    const reconversionParcours: ReconversionParcoursId | undefined =
      format === "reconversion" ? PARCOURS_ORDER[(i - 1) % 3]! : undefined

    const ponctuelleDomaine: PonctuelleDomainId | undefined =
      format === "ponctuelle"
        ? PONCTUELLE_DOMAINES[(i - 1) % PONCTUELLE_DOMAINES.length]!.id
        : undefined

    out.push({
      id: `mod-${String(i).padStart(3, "0")}`,
      titre: `${topic} — ${aspect}`,
      description:
        `Contenu pédagogique structuré pour le format « ${MODULE_FORMAT_LABELS[format]} ». ` +
        `Objectifs opérationnels, travaux dirigés et évaluation continue. Module ${i} du catalogue CSF (démo).`,
      format,
      reconversionParcours,
      ponctuelleDomaine,
      dureeHeures,
      nombreLabs,
      examen,
      supportsPdf,
    })
  }
  return out
}

export const CATALOGUE_MODULES_INITIAL = buildCatalogueModules()
