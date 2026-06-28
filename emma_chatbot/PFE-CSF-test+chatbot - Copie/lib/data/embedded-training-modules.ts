/**
 * Modules formation système embarqué — images = assets présents dans /public/images
 * (remplace les chemins du zip qui pointaient vers des fichiers absents)
 */
export interface EmbeddedTrainingModule {
  id: string
  imageUrl: string
  title: string
  description: string
  badge: { icon: string; label: string }
  duration: string
  practice: string
  project: string
  evaluation: string
}

export const embeddedTrainingModules: EmbeddedTrainingModule[] = [
  {
    id: "1",
    imageUrl: "/images/systemes-embarques.jpg",
    title: "Langage C pour les systèmes embarqués (Embedded C)",
    description:
      "Maîtriser les fondamentaux et l'implémentation des RTOS pour concevoir et gérer des applications multitâches optimisées et portables.",
    badge: { icon: "©️", label: "Comtoc" },
    duration: "4 jours (4h/jour)",
    practice: "+14 Lab",
    project: "Développement d'un pilot générique pour GPIOS",
    evaluation: "+14 Lab",
  },
  {
    id: "2",
    imageUrl: "/images/custom-dev.jpg",
    title: "Architecture ARM et Programmation Système",
    description:
      "Explorez les concepts fondamentaux de l'architecture ARM, les modes de processeur et les techniques d'optimisation pour les systèmes embarqués.",
    badge: { icon: "🏗️", label: "Comtoc" },
    duration: "5 jours (4h/jour)",
    practice: "+18 Lab",
    project: "Développement d'un bootloader minimaliste",
    evaluation: "+18 Lab",
  },
  {
    id: "3",
    imageUrl: "/images/formation-data-ai.jpg",
    title: "Programmation RTOS et Synchronisation",
    description:
      "Apprenez à utiliser les systèmes d'exploitation temps réel pour gérer les tâches concurrentes et les mécanismes de synchronisation.",
    badge: { icon: "⚙️", label: "Comtoc" },
    duration: "4 jours (4h/jour)",
    practice: "+16 Lab",
    project: "Système multi-tâche avec communication inter-tâche",
    evaluation: "+16 Lab",
  },
  {
    id: "4",
    imageUrl: "/images/formation-fullstack.jpg",
    title: "Linux Embarqué et Drivers Kernel",
    description:
      "Maîtrisez Linux embarqué, la compilation du kernel, et le développement de drivers pour contrôler les périphériques matériels.",
    badge: { icon: "🐧", label: "Comtoc" },
    duration: "6 jours (4h/jour)",
    practice: "+20 Lab",
    project: "Développement d'un driver de capteur personnalisé",
    evaluation: "+20 Lab",
  },
  {
    id: "5",
    imageUrl: "/images/hero-laptop.png",
    title: "Communication sans fil et Connectivité",
    description:
      "Intégrez WiFi, Bluetooth et Zigbee dans vos projets IoT pour créer des écosystèmes connectés robustes et sécurisés.",
    badge: { icon: "📡", label: "Comtoc" },
    duration: "3 jours (4h/jour)",
    practice: "+12 Lab",
    project: "Développement d'une application IoT connectée",
    evaluation: "+12 Lab",
  },
  {
    id: "6",
    imageUrl: "/images/formation-testeur.jpg",
    title: "Sécurité des Systèmes Embarqués",
    description:
      "Protégez vos applications : cryptographie, gestion des secrets, prévention des attaques courantes et conformité aux normes.",
    badge: { icon: "🔒", label: "Comtoc" },
    duration: "4 jours (4h/jour)",
    practice: "+15 Lab",
    project: "Implémentation d'une solution sécurisée",
    evaluation: "+15 Lab",
  },
]

/** Les 4 premiers modules affichés sur /formation (section hors pack) */
export const horsPackModules = embeddedTrainingModules.slice(0, 4)
