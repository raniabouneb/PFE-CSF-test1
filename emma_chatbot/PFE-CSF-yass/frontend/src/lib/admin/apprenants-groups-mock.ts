import type {
  ModuleFormat,
  PonctuelleDomainId,
  ReconversionParcoursId,
} from "@/lib/admin/catalogue-mock-data"

export type ApprenantGroupStatut = "active" | "terminee" | "suspendue"

export type ApprenantGroup = {
  id: string
  name: string
  formation: string
  nombreApprenants: number
  progressionMoyenne: number
  dateDebut: string
  statut: ApprenantGroupStatut
  format: ModuleFormat
  reconversionParcours?: ReconversionParcoursId
  ponctuelleDomaine?: PonctuelleDomainId
}

export type ApprenantsMainFormatFilter = "all" | ModuleFormat

export type ApprenantsGroupFilters = {
  mainFormat: ApprenantsMainFormatFilter
  rcParcours: "all" | ReconversionParcoursId
  pnDomain: "all" | PonctuelleDomainId
}

export const APPRENANT_MOCK_GROUPS: ApprenantGroup[] = [
  {
    id: "1",
    name: "Groupe A - Full Stack",
    formation: "Développement Full-Stack",
    nombreApprenants: 24,
    progressionMoyenne: 68,
    dateDebut: "2024-01-15",
    statut: "active",
    format: "reconversion",
    reconversionParcours: "fullstack",
  },
  {
    id: "2",
    name: "Groupe B - Data Analyst",
    formation: "Data Analyst - Pack Complet",
    nombreApprenants: 18,
    progressionMoyenne: 45,
    dateDebut: "2024-02-01",
    statut: "active",
    format: "ponctuelle",
    ponctuelleDomaine: "data_ia",
  },
  {
    id: "3",
    name: "Groupe C - Embarqué",
    formation: "Systèmes Embarqués",
    nombreApprenants: 15,
    progressionMoyenne: 82,
    dateDebut: "2023-11-20",
    statut: "active",
    format: "reconversion",
    reconversionParcours: "embarque",
  },
  {
    id: "4",
    name: "Groupe D - Agile",
    formation: "Management Agile & Scrum",
    nombreApprenants: 12,
    progressionMoyenne: 95,
    dateDebut: "2023-12-10",
    statut: "terminee",
    format: "ponctuelle",
    ponctuelleDomaine: "management",
  },
  {
    id: "5",
    name: "Groupe E - Testeur",
    formation: "Devenir Testeur",
    nombreApprenants: 20,
    progressionMoyenne: 30,
    dateDebut: "2024-03-01",
    statut: "active",
    format: "reconversion",
    reconversionParcours: "test_logiciel",
  },
  {
    id: "6",
    name: "Groupe F - Linguistique",
    formation: "Formation Linguistique",
    nombreApprenants: 16,
    progressionMoyenne: 55,
    dateDebut: "2024-01-20",
    statut: "active",
    format: "ponctuelle",
    ponctuelleDomaine: "design_ux",
  },
  {
    id: "7",
    name: "Groupe G - Cloud ops",
    formation: "AWS & Kubernetes",
    nombreApprenants: 14,
    progressionMoyenne: 72,
    dateDebut: "2024-04-01",
    statut: "active",
    format: "ponctuelle",
    ponctuelleDomaine: "cloud",
  },
  {
    id: "8",
    name: "Groupe H - Cybersécurité",
    formation: "SOC analyst",
    nombreApprenants: 11,
    progressionMoyenne: 58,
    dateDebut: "2024-03-15",
    statut: "active",
    format: "ponctuelle",
    ponctuelleDomaine: "cyber",
  },
  {
    id: "9",
    name: "Groupe I - Sur mesure TechMed",
    formation: "Parcours entreprise — IoT médical",
    nombreApprenants: 22,
    progressionMoyenne: 61,
    dateDebut: "2024-02-10",
    statut: "active",
    format: "sur_mesure",
  },
]

export function filterApprenantGroups(
  groups: ApprenantGroup[],
  f: ApprenantsGroupFilters
): ApprenantGroup[] {
  return groups.filter((g) => {
    if (f.mainFormat !== "all" && g.format !== f.mainFormat) return false

    if (f.rcParcours !== "all") {
      if (g.format !== "reconversion" || g.reconversionParcours !== f.rcParcours) return false
    }
    if (f.pnDomain !== "all") {
      if (g.format !== "ponctuelle" || g.ponctuelleDomaine !== f.pnDomain) return false
    }

    return true
  })
}
