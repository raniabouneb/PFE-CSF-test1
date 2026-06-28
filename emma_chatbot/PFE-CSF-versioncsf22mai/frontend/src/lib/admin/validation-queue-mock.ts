/** File d’attente de validation — données mock pour le back-office. */

export type ValidationDocKind = "certificate" | "recommendation"

export type ValidationQueueItem = {
  id: string
  kind: ValidationDocKind
  learnerName: string
  learnerEmail: string
  formationLabel: string
  /** Type / parcours suivi (affiché sous la visionneuse — hors certificat). */
  formationTypeFollowed: string
  obtainedScore: number
  maxScore: number
  /** Présence finale aux séances (%). */
  finalPresencePercent: number
  submittedAtISO: string
  /** Contenu affiché dans la visionneuse (texte sécurisé — mock uniquement). */
  documentTitle: string
  paragraphs: string[]
}

const KIND_LABELS: Record<ValidationDocKind, string> = {
  certificate: "Certificat",
  recommendation: "Lettre de recommandation",
}

export function labelValidationKind(kind: ValidationDocKind): string {
  return KIND_LABELS[kind]
}

/** Agrégats mensuels pour les KPI du centre de validation (simulation — hors file courante). */
export const VALIDATION_CENTER_MONTHLY_STATS = {
  /** Certifications / attestations délivrées après validation le mois indiqué */
  certificationsDeliveredLastMonth: 52,
  /** Lettres de recommandation validées et transmises le mois indiqué */
  recommendationLettersDeliveredLastMonth: 14,
  /** Période affichée (« mois dernier » par rapport à la date de référence produit) */
  monthLabel: "mars 2026",
} as const

export function createInitialValidationQueue(): ValidationQueueItem[] {
  const base = new Date()
  const daysAgo = (d: number) => {
    const x = new Date(base)
    x.setDate(x.getDate() - d)
    return x.toISOString()
  }

  return [
    {
      id: "v1",
      kind: "certificate",
      learnerName: "Samira Benali",
      learnerEmail: "samira.benali@example.com",
      formationLabel: "Parcours Full stack — Promotion 2025",
      formationTypeFollowed: "Reconversion — Parcours Full stack",
      obtainedScore: 16.5,
      maxScore: 20,
      finalPresencePercent: 94,
      submittedAtISO: daysAgo(1),
      documentTitle: "CERTIFICAT DE FIN DE FORMATION",
      paragraphs: [
        "Le Centre de Formation certifie que Mme Samira Benali a suivi avec assiduité le parcours « Développement Full stack » et a validé l’ensemble des modules et du projet de synthèse.",
        "Durée cumulée : 420 heures. Mention : Bien.",
        "Ce certificat est délivré à titre informatif ; la version signée et scellée sera générée après validation administrative.",
        "Fait pour servir et valoir ce que de droit.",
      ],
    },
    {
      id: "v2",
      kind: "recommendation",
      learnerName: "Lucas Martin",
      learnerEmail: "lucas.martin@example.com",
      formationLabel: "Test logiciel & automatisation",
      formationTypeFollowed: "Ponctuelle — Test logiciel & automatisation",
      obtainedScore: 18,
      maxScore: 20,
      finalPresencePercent: 88,
      submittedAtISO: daysAgo(2),
      documentTitle: "LETTRE DE RECOMMANDATION",
      paragraphs: [
        "À l’attention des recruteurs,",
        "Nous avons eu le plaisir d’accompagner M. Lucas Martin dans le cadre de la formation « Test logiciel & automatisation ». Son engagement, sa rigueur méthodologique et sa capacité à documenter les campagnes de tests ont été remarquables.",
        "Nous recommandons favorablement M. Martin pour tout poste en qualité assurance ou automatisation de tests.",
        "Pour toute vérification : validation@csf.example — réf. dossier LUCAS-TL-2025.",
      ],
    },
    {
      id: "v3",
      kind: "certificate",
      learnerName: "Nadia Khemiri",
      learnerEmail: "nadia.k@example.com",
      formationLabel: "Systèmes embarqués — IoT",
      formationTypeFollowed: "Reconversion — Systèmes embarqués (IoT)",
      obtainedScore: 15,
      maxScore: 20,
      finalPresencePercent: 91,
      submittedAtISO: daysAgo(3),
      documentTitle: "ATTESTATION DE COMPÉTENCES",
      paragraphs: [
        "Attestation délivrée à Mme Nadia Khemiri suite au parcours « Systèmes embarqués — IoT ».",
        "Compétences couvertes : programmation bas niveau, bus de terrain, prototypage matériel.",
        "Document provisoire — la version officielle sera émise après contrôle du service certification.",
      ],
    },
    {
      id: "v5",
      kind: "certificate",
      learnerName: "Inès Boukhris",
      learnerEmail: "ines.boukhris@example.com",
      formationLabel: "Cybersécurité défensive — SOC niveau 1",
      formationTypeFollowed: "Ponctuelle — Cybersécurité défensive",
      obtainedScore: 17,
      maxScore: 20,
      finalPresencePercent: 89,
      submittedAtISO: daysAgo(4),
      documentTitle: "CERTIFICAT DE COMPÉTENCES — CYBERSÉCURITÉ",
      paragraphs: [
        "Le Centre de Formation atteste que Mme Inès Boukhris a complété le module « Cybersécurité défensive — SOC niveau 1 » avec une assiduité exemplaire.",
        "Compétences abordées : détection d’incidents, journaux SIEM, bonnes pratiques de durcissement.",
        "Document provisoire — version signée après validation du service certification.",
      ],
    },
    {
      id: "v4",
      kind: "recommendation",
      learnerName: "Youssef Amrani",
      learnerEmail: "y.amrani@example.com",
      formationLabel: "Parcours Full stack — Promotion 2025",
      formationTypeFollowed: "Sur mesure — Full stack (entreprise)",
      obtainedScore: 17.25,
      maxScore: 20,
      finalPresencePercent: 96,
      submittedAtISO: daysAgo(5),
      documentTitle: "LETTRE DE RECOMMANDATION PROFESSIONNELLE",
      paragraphs: [
        "Madame, Monsieur,",
        "M. Youssef Amrani a suivi notre parcours Full stack et a démontré d’excellentes aptitudes en conception d’API et en intégration front-end.",
        "Nous le recommandons pour des missions de développement applicatif ou de mentorat technique.",
        "Cordialement, Le service pédagogique.",
      ],
    },
  ]
}
