import type { KnowledgeEntry } from "./types"

export const CSF_INFO = {
  name: "CSF",
  fullName: "Conseil · Solution · Formation",
  description:
    "Conseil stratégique, solution sur mesure et formation d'experts : CSF réunit trois pôles d'excellence pour une prise en charge intégrale de vos défis technologiques.",
  email: "contact@csf.tn",
  phone: "+216 98 765 432",
  address: "El Ghazala, Ariana, Tunisie",
  stats: {
    projectsCompleted: 180,
    partnersCount: 25,
    yearsOfExperience: 15,
  },
}

export const POLES = {
  conseil: {
    title: "Pôle Conseil",
    subtitle: "Accompagnement stratégique sur Mesure",
    description: "Passer de l'idée à la production avec une stratégie technologique maîtrisée.",
    services: [
      {
        title: "Stratégie & Partenariats",
        description:
          "Nous définissons votre vision en nous appuyant sur un écosystème de partenaires leaders pour garantir des résultats concrets.",
      },
      {
        title: "Transformation Digitale",
        description:
          "Pilotez votre transformation avec les meilleures technologies du marché pour optimiser vos processus internes.",
      },
      {
        title: "Performance Opérationnelle",
        description:
          "Un conseil de haut niveau pour booster votre productivité et transformer vos ambitions en succès opérationnels.",
      },
      {
        title: "Développement du Potentiel",
        description:
          "Orientation et amélioration des compétences pour les porteurs de projets souhaitant propulser leur parcours professionnel.",
      },
    ],
    link: "/#consulting",
  },
  solution: {
    title: "Pôle Solution",
    subtitle: "L'Intelligence Connectée",
    description:
      "Vous avez un défi technologique ? Nos ingénieurs vous accompagnent dans le développement de vos solutions IoT et de supervision.",
    services: [
      {
        title: "Systèmes Embarqués & IoT",
        description:
          "Conception de systèmes intelligents : Edge AI, temps réel et communication industrielle. Nous connectons vos actifs pour un pilotage précis.",
      },
      {
        title: "Supervision & Data",
        description:
          "Visualisez vos données en temps réel. Nos solutions de supervision transforment la donnée brute en leviers de décision.",
      },
      {
        title: "100% Custom",
        description: "Développement spécifique selon vos besoins métier.",
      },
    ],
    link: "/#solution",
  },
  formation: {
    title: "Pôle Formation",
    subtitle: "Expertise & Transmission",
    description:
      "Renforcez vos compétences techniques avec des experts reconnus pour maîtriser les technologies de demain.",
    formats: [
      {
        title: "Reconversion Métier",
        description:
          "Boostez votre transition : utilisez notre agent IA d'analyse de CV pour découvrir le parcours de reconversion le plus adapté à votre profil.",
        link: "/formation?open=reconversion",
      },
      {
        title: "Formation à la Carte",
        description: "Maîtrisez une compétence précise et montez en expertise à votre rythme.",
        link: "/formation?open=ponctuelle",
      },
      {
        title: "Parcours Sur-Mesure",
        description: "Un programme 100% personnalisé selon vos objectifs et votre emploi du temps.",
        link: "/formation?open=parcours",
      },
    ],
    link: "/formation",
  },
}

export const CURSUS = [
  {
    id: "optimum",
    name: "OPTIMUM",
    title: "CSF-RCP - Développement en Système Embarqué",
    description:
      "Cursus fondamental pour maîtriser le développement embarqué de A à Z : C, STM32, C++, Qt, Linux et projets IoT.",
    modules: [
      "L'essentiel du langage C pour embarqué",
      "Langage C pour les systèmes embarqués",
      "Architecture et programmation des uC STM32",
      "Projet IoT sur STM32",
      "La programmation orientée objets en C++",
      "IHM QT pour les systèmes embarqués",
      "Projet IHM sur Arduino",
      "Linux embarqué et programmation Shell",
      "« Kernelspace » et intégration des drivers",
      "Programmation sur environnement Linux",
      "Projet IoT sur Raspberry Pi",
      "Stage de Projet de Fin de Formation",
    ],
    prerequisites: ["c", "électronique", "logique", "algorithmique"],
    link: "/formation/reconversion/systeme-embarque",
  },
  {
    id: "silver",
    name: "SILVER",
    title: "RTOS & Protocoles - Systèmes Temps Réel",
    description:
      "Spécialisation en systèmes temps réel, RTOS et protocoles industriels pour les applications critiques.",
    modules: [
      "RTOS FreeRTOS et µC/OS-III",
      "Synchronisation et communication inter-tâches",
      "Protocoles CAN, Modbus et MQTT",
      "Gestion de la mémoire en temps réel",
      "Debugging et optimisation performante",
      "Projet : Système multi-tâches temps réel",
      "Stage projet avancé",
    ],
    prerequisites: ["c", "embarqué", "stm32", "microcontrôleur", "gpio"],
    link: "/formation/reconversion/systeme-embarque",
  },
  {
    id: "gold",
    name: "GOLD",
    title: "IoT Avancé & Cloud - Écosystème Connecté",
    description:
      "Maîtrisez l'écosystème IoT complet : cloud, edge computing, sécurité et analytics en temps réel.",
    modules: [
      "Architecture IoT en couches",
      "MQTT, CoAP et protocoles légers",
      "Intégration Azure IoT Hub et AWS IoT",
      "Processing et analytics en temps réel",
      "Edge computing et IA sur microcontrôleurs",
      "Sécurité et cryptographie pour IoT",
      "Projet : Plateforme IoT complète",
      "Stage projet enterprise",
    ],
    prerequisites: ["c", "linux", "réseau", "mqtt", "embarqué", "iot"],
    link: "/formation/reconversion/systeme-embarque",
  },
]

export const RECONVERSION_TRACKS = [
  {
    id: "systeme-embarque",
    title: "CSF-RCP – Développement en Système Embarqué",
    description: "Formation professionnelle animée par des experts industriels.",
    stats: {
      modules: "16 modules",
      labs: "70 Lab",
      projects: "4 Projets réels IoT",
      exercises: "+1000 exercices",
      coaching: "4 réunions individuelles/Mois",
      exams: "11 examens",
    },
    link: "/formation/reconversion/systeme-embarque",
  },
  {
    id: "full-stack",
    title: "CSF-RCP – Développement Full-Stack",
    description: "Devenez développeur full-stack avec les technologies web modernes.",
    link: "/formation/reconversion/full-stack",
  },
  {
    id: "testeur-logiciel",
    title: "CSF-RCP – Académie en Testeur Logiciel",
    description: "Maîtrisez les techniques de test logiciel et la certification ISTQB.",
    link: "/formation/reconversion/testeur-logiciel",
  },
]

export const MINI_PACKS = [
  {
    id: "microcontroller",
    title: "Microcontrôleur",
    modules: [
      "Fondamentals d'électronique",
      "Programmation ARM Cortex-M",
      "Interruptions et Timers",
      "Projet : Capteur Intelligent",
      "Communication I²C & SPI",
    ],
  },
  {
    id: "processor",
    title: "Processeur",
    modules: [
      "Architecture x86/ARM",
      "Pipeline et Cache",
      "Optimisation de Performance",
      "Projet : Benchmark Système",
      "Assembleur Avancé",
    ],
  },
]

export const EMBEDDED_MODULES = [
  {
    title: "Langage C pour les systèmes embarqués (Embedded C)",
    duration: "4 jours (4h/jour)",
    project: "Développement d'un pilot générique pour GPIOS",
  },
  {
    title: "Architecture ARM et Programmation Système",
    duration: "5 jours (4h/jour)",
    project: "Développement d'un bootloader minimaliste",
  },
  {
    title: "Programmation RTOS et Synchronisation",
    duration: "4 jours (4h/jour)",
    project: "Système multi-tâche avec communication inter-tâche",
  },
  {
    title: "Linux Embarqué et Drivers Kernel",
    duration: "6 jours (4h/jour)",
    project: "Développement d'un driver de capteur personnalisé",
  },
  {
    title: "Communication sans fil et Connectivité",
    duration: "3 jours (4h/jour)",
    project: "Développement d'une application IoT connectée",
  },
  {
    title: "Sécurité des Systèmes Embarqués",
    duration: "4 jours (4h/jour)",
    project: "Implémentation d'une solution sécurisée",
  },
]

export const PONCTUELLE_TOPICS = [
  "Système Embarqué",
  "Full-Stack",
  "Test Logiciel",
  "Data, AI, DevOps",
  "Langue",
  "Soft Skills",
]

export const CERTIFICATIONS = [
  {
    title: "Expert en Systèmes Embarqués STM32",
    category: "Embedded Systems",
    skills: ["C/C++", "RTOS", "HAL", "GPIO", "UART"],
    duration: "12 semaines",
    level: "Avancé",
  },
  {
    title: "Full Stack Web Moderne",
    category: "Web Development",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"],
    duration: "16 semaines",
    level: "Avancé",
  },
  {
    title: "Gestion de Projet Agile & DevOps",
    category: "Management",
    skills: ["Scrum", "Kanban", "CI/CD", "Git", "Agile"],
    duration: "8 semaines",
    level: "Intermédiaire",
  },
  {
    title: "IoT & Connectivité ESP32",
    category: "Embedded Systems",
    skills: ["C++", "MQTT", "BLE", "WiFi", "Arduino"],
    duration: "10 semaines",
    level: "Intermédiaire",
  },
  {
    title: "Frontend Expert Next.js",
    category: "Web Development",
    skills: ["Next.js", "React", "Tailwind CSS", "Performance", "SEO"],
    duration: "12 semaines",
    level: "Avancé",
  },
  {
    title: "Leadership Tech",
    category: "Management",
    skills: ["Leadership", "Communication", "Stratégie", "RH", "Coaching"],
    duration: "6 semaines",
    level: "Débutant",
  },
]

export const PARTNERS = [
  "TELNET",
  "Sofiatech",
  "Sofrecom",
  "FOCUS",
  "Faurecia",
  "Altran",
  "FST",
]

export const FAQ = [
  {
    question: "Qu'est-ce que CSF-RCP ?",
    answer:
      "CSF-RCP® est notre programme de reconversion professionnelle, le premier en Tunisie à proposer une formation de reconstitution de carrière dans plusieurs domaines à forte demande sur les marchés tunisien et international.",
  },
  {
    question: "Comment s'inscrire à une formation ?",
    answer:
      "Vous pouvez vous inscrire via notre page Formation, nous contacter par email à contact@csf.tn ou par téléphone au +216 98 765 432.",
  },
  {
    question: "Proposez-vous des certifications en ligne ?",
    answer:
      "Oui ! Vous pouvez passer nos tests de certification directement en ligne sans suivre de formation. Consultez notre page Certifications.",
  },
  {
    question: "Combien de modules proposez-vous ?",
    answer:
      "Nous proposons un portfolio de 56 modules experts en formation ponctuelle, ainsi que 16 modules pour le parcours Système Embarqué avec plus de 70 labs pratiques.",
  },
]

function buildKnowledgeEntries(): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = []

  entries.push({
    id: "csf-about",
    category: "general",
    title: "À propos de CSF",
    content: `${CSF_INFO.fullName} — ${CSF_INFO.description} Plus de ${CSF_INFO.stats.yearsOfExperience} ans d'expérience, ${CSF_INFO.stats.projectsCompleted}+ projets réalisés et ${CSF_INFO.stats.partnersCount}+ partenaires.`,
    keywords: ["csf", "conseil", "solution", "formation", "entreprise", "qui", "présentation", "about"],
    link: "/",
  })

  entries.push({
    id: "contact",
    category: "contact",
    title: "Contact CSF",
    content: `Email : ${CSF_INFO.email}\nTéléphone : ${CSF_INFO.phone}\nAdresse : ${CSF_INFO.address}`,
    keywords: ["contact", "email", "téléphone", "adresse", "joindre", "appeler", "localisation", "où"],
    link: "/#contact",
  })

  for (const [key, pole] of Object.entries(POLES)) {
    const servicesText = pole.services
      ? pole.services.map((s) => `• **${s.title}** : ${s.description}`).join("\n")
      : pole.formats?.map((f) => `• **${f.title}** : ${f.description}`).join("\n") ?? ""

    entries.push({
      id: `pole-${key}`,
      category: "pole",
      title: pole.title,
      content: `**${pole.subtitle}**\n${pole.description}\n\n${servicesText}`,
      keywords: [key, pole.title.toLowerCase(), pole.subtitle.toLowerCase(), ...pole.title.split(" ")],
      link: pole.link,
    })
  }

  for (const cursus of CURSUS) {
    entries.push({
      id: `cursus-${cursus.id}`,
      category: "cursus",
      title: `${cursus.name} — ${cursus.title}`,
      content: `${cursus.description}\n\n**Modules :**\n${cursus.modules.map((m) => `• ${m}`).join("\n")}`,
      keywords: [
        cursus.id,
        cursus.name.toLowerCase(),
        "cursus",
        "reconversion",
        "parcours",
        ...cursus.title.toLowerCase().split(" "),
      ],
      link: cursus.link,
    })
  }

  for (const track of RECONVERSION_TRACKS) {
    entries.push({
      id: `track-${track.id}`,
      category: "reconversion",
      title: track.title,
      content: track.description + (track.stats ? `\n\n**Chiffres clés :** ${Object.values(track.stats).join(", ")}` : ""),
      keywords: ["reconversion", track.id, ...track.title.toLowerCase().split(" ")],
      link: track.link,
    })
  }

  for (const pack of MINI_PACKS) {
    entries.push({
      id: `mini-${pack.id}`,
      category: "mini-pack",
      title: `Mini Pack ${pack.title}`,
      content: `**Modules :**\n${pack.modules.map((m) => `• ${m}`).join("\n")}`,
      keywords: ["mini pack", pack.id, pack.title.toLowerCase(), "microcontrôleur", "processeur"],
      link: "/formation/reconversion/systeme-embarque",
    })
  }

  for (const mod of EMBEDDED_MODULES) {
    entries.push({
      id: `module-${mod.title.slice(0, 20)}`,
      category: "formation",
      title: mod.title,
      content: `Durée : ${mod.duration}\nProjet : ${mod.project}`,
      keywords: mod.title.toLowerCase().split(" ").concat(["formation", "module", "embarqué", "ponctuelle"]),
      link: "/formations-ponctuelles",
    })
  }

  entries.push({
    id: "ponctuelle",
    category: "formation",
    title: "Formations Ponctuelles",
    content: `Portfolio de 56 modules experts dans les domaines : ${PONCTUELLE_TOPICS.join(", ")}.`,
    keywords: ["ponctuelle", "module", "formation", "carte", "compétence", "expert"],
    link: "/formations-ponctuelles",
  })

  for (const cert of CERTIFICATIONS) {
    entries.push({
      id: `cert-${cert.title.slice(0, 15)}`,
      category: "certification",
      title: cert.title,
      content: `**${cert.category}** — Niveau ${cert.level}\nDurée : ${cert.duration}\nCompétences : ${cert.skills.join(", ")}`,
      keywords: ["certification", "certifié", "examen", "test", ...cert.skills.map((s) => s.toLowerCase())],
      link: "/certifications",
    })
  }

  entries.push({
    id: "partners",
    category: "partenaires",
    title: "Nos Partenaires",
    content: `CSF collabore avec des leaders de l'industrie : ${PARTNERS.join(", ")}. Plus de ${CSF_INFO.stats.partnersCount} partenaires et ${CSF_INFO.stats.projectsCompleted}+ projets réalisés.`,
    keywords: ["partenaire", "collaboration", "entreprise", "telnet", "sofiatech", "faurecia"],
    link: "/#partenaires",
  })

  for (const item of FAQ) {
    entries.push({
      id: `faq-${item.question.slice(0, 20)}`,
      category: "faq",
      title: item.question,
      content: item.answer,
      keywords: item.question.toLowerCase().split(" ").concat(item.answer.toLowerCase().split(" ")),
    })
  }

  return entries
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = buildKnowledgeEntries()

export function searchKnowledge(query: string, limit = 5): KnowledgeEntry[] {
  const normalizedQuery = normalizeText(query)
  const queryTokens = tokenize(normalizedQuery)

  if (queryTokens.length === 0) return []

  const scores = KNOWLEDGE_BASE.map((entry) => {
    const entryText = normalizeText(`${entry.title} ${entry.content} ${entry.keywords.join(" ")}`)
    const entryTokens = tokenize(entryText)

    let score = 0
    for (const qt of queryTokens) {
      if (entry.keywords.some((kw) => fuzzyMatch(qt, normalizeText(kw)))) {
        score += 3
      }
      for (const et of entryTokens) {
        if (fuzzyMatch(qt, et)) {
          score += tfidfWeight(qt, entryTokens, KNOWLEDGE_BASE)
        }
      }
      if (normalizeText(entry.title).includes(qt)) {
        score += 2
      }
    }
    return { entry, score }
  })

  return scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry)
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
}

function tokenize(text: string): string[] {
  const stopWords = new Set([
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "à", "au", "aux",
    "pour", "par", "sur", "dans", "avec", "est", "ce", "qui", "que", "comment", "quel",
    "quelle", "quels", "quelles", "je", "tu", "il", "nous", "vous", "mon", "ma", "mes",
  ])
  return text
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t))
}

function fuzzyMatch(a: string, b: string): boolean {
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true
  if (a.length >= 4 && b.length >= 4) {
    const dist = levenshtein(a, b)
    const threshold = Math.floor(Math.min(a.length, b.length) / 3)
    return dist <= threshold
  }
  return false
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1
    }
  }
  return matrix[b.length][a.length]
}

function tfidfWeight(term: string, docTokens: string[], corpus: KnowledgeEntry[]): number {
  const tf = docTokens.filter((t) => fuzzyMatch(t, term)).length / Math.max(docTokens.length, 1)
  const docsWithTerm = corpus.filter((entry) => {
    const text = normalizeText(`${entry.title} ${entry.content} ${entry.keywords.join(" ")}`)
    return tokenize(text).some((t) => fuzzyMatch(t, term))
  }).length
  const idf = Math.log((corpus.length + 1) / (docsWithTerm + 1)) + 1
  return tf * idf
}
