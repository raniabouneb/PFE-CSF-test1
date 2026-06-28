/**
 * Données de démo pour le tableau de bord admin.
 * Remplacer par des appels API (agrégations analytics, audit log) quand le backend sera prêt.
 */

export type KpiKey = "inscrits" | "certifications" | "visitesWeb" | "nouveauxComptes"

/** 4 KPI — indicateurs pour le mois en cours (démo). */
export const KPI_DEFINITIONS_MAIN: {
  id: KpiKey
  label: string
  sublabel: string
  value: string
  trend?: string
}[] = [
  {
    id: "inscrits",
    label: "Apprenants inscrits",
    sublabel: "Sur le mois en cours",
    value: "186",
    trend: "+8 % vs mois précédent",
  },
  {
    id: "certifications",
    label: "Certifications délivrées",
    sublabel: "Sur le mois en cours",
    value: "42",
    trend: "+12",
  },
  {
    id: "visitesWeb",
    label: "Visites site web",
    sublabel: "Sessions uniques — mois en cours",
    value: "12,8k",
    trend: "+5,4 %",
  },
  {
    id: "nouveauxComptes",
    label: "Nouveaux comptes",
    sublabel: "Inscriptions plateforme — mois en cours",
    value: "54",
    trend: "+3",
  },
]

/** Top formations : chiffre brut + score 0–100 pour hauteur des segments (démo). */
export const TOP_VISITED: { title: string; visits: number; slug: string; score: number }[] = [
  { title: "Algorithmes structurés", visits: 4280, slug: "algo", score: 85.3 },
  { title: "Programmation objet", visits: 3120, slug: "obj", score: 64.7 },
  { title: "Bases de données", visits: 2890, slug: "db", score: 84.2 },
  { title: "Développement web", visits: 2410, slug: "web", score: 45.6 },
  { title: "Application mobile", visits: 1980, slug: "mobile", score: 43.5 },
  { title: "Machine learning", visits: 2650, slug: "ml", score: 74.4 },
]

export const TOP_ENROLLED: { title: string; enrollments: number; slug: string; score: number }[] = [
  { title: "Data Analyst — Pack", enrollments: 186, slug: "data-analyst", score: 88 },
  { title: "Reconversion IA", enrollments: 142, slug: "ia-gen", score: 72 },
  { title: "Excel & Power BI", enrollments: 118, slug: "excel-pbi", score: 61 },
  { title: "Gestion projet agile", enrollments: 96, slug: "agile", score: 52 },
  { title: "Cloud AWS", enrollments: 84, slug: "aws", score: 48 },
  { title: "Cybersécurité", enrollments: 110, slug: "cyber", score: 58 },
]

/** 6 derniers mois — courbe inscriptions (démo). */
export const INSCRIPTION_MONTH_LABELS = ["Mai", "Juin", "Juil", "Août", "Sept", "Oct"]

/** Courbe « évolution des inscriptions » : uniquement formats Reconversion vs Ponctuelle (6 mois). */
export const INSCRIPTION_FORMAT_SERIES: {
  id: string
  name: string
  color: string
  dashed?: boolean
  values: number[]
}[] = [
  { id: "reconv", name: "Reconversion", color: "#2ea3b8", values: [72, 118, 155, 210, 298, 382] },
  { id: "ponct", name: "Ponctuelle", color: "#173c60", dashed: true, values: [32, 48, 62, 95, 188, 268] },
]

export type AdminAuditActor = "admin" | "assistant" | "system"

export type AdminAuditEntry = {
  id: string
  at: string
  actor: AdminAuditActor
  actorDisplay: string
  action: string
  detail?: string
}

export const RECENT_ACTIVITIES: AdminAuditEntry[] = [
  {
    id: "1",
    at: "Aujourd’hui · 14:32",
    actor: "admin",
    actorDisplay: "Administrateur",
    action: "Validation d’une demande de parcours sur mesure",
    detail: "Entreprise : TechMed SA",
  },
  {
    id: "2",
    at: "Aujourd’hui · 11:05",
    actor: "assistant",
    actorDisplay: "Assistante",
    action: "Mise à jour du planning d’une séance",
    detail: "Python Avancé — 18 avril",
  },
  {
    id: "3",
    at: "Hier · 16:48",
    actor: "admin",
    actorDisplay: "Administrateur",
    action: "Publication d’une nouvelle session catalogue",
    detail: "Formation « Cybersécurité »",
  },
  {
    id: "4",
    at: "Hier · 09:12",
    actor: "assistant",
    actorDisplay: "Assistante",
    action: "Export du rapport mensuel (PDF)",
    detail: "Mars 2026",
  },
  {
    id: "5",
    at: "Il y a 2 j · 15:20",
    actor: "system",
    actorDisplay: "Système",
    action: "Synchronisation des cartes certifications",
    detail: "12 cartes mises à jour",
  },
]

export function monthReportLabel(): string {
  const d = new Date()
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
}

/** Pour export PDF (résumé chiffré des séries visibles). */
export const CHART_MONTH_LABELS = INSCRIPTION_MONTH_LABELS

export const CHART_SERIES = INSCRIPTION_FORMAT_SERIES.map((s) => ({
  name: s.name,
  color: s.color,
  values: s.values,
}))
