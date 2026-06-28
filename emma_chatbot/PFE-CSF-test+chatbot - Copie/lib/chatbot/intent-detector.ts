import type { ChatIntent, IntentResult } from "./types"

interface IntentPattern {
  intent: ChatIntent
  keywords: string[]
  weight: number
  entities?: string[]
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: "GREETING",
    keywords: ["bonjour", "salut", "hello", "hey", "bonsoir", "coucou", "bjr", "slt", "hi"],
    weight: 1,
  },
  {
    intent: "CV_ANALYSIS",
    keywords: ["cv", "curriculum", "compétence", "competence", "analyser", "profil", "parcours professionnel", "resume", "résumé"],
    weight: 1.5,
  },
  {
    intent: "CURSUS_DETAIL",
    keywords: ["optimum", "silver", "gold", "cursus", "mini pack", "microcontrôleur", "microcontroleur", "processeur"],
    weight: 1.3,
    entities: ["optimum", "silver", "gold", "microcontroller", "processor"],
  },
  {
    intent: "RECONVERSION",
    keywords: [
      "reconversion", "reconvertir", "changer métier", "changer metier", "carrière", "carriere",
      "transition", "nouveau métier", "reconversion professionnelle", "rcp", "csf-rcp",
      "full stack", "fullstack", "testeur", "embarqué", "embarque",
    ],
    weight: 1.2,
  },
  {
    intent: "FORMATION_GENERAL",
    keywords: [
      "formation", "formations", "apprendre", "cours", "module", "modules", "stage",
      "lab", "labs", "enseignement", "étudier", "etudier", "ponctuelle", "sur mesure",
    ],
    weight: 1,
  },
  {
    intent: "CONSEIL",
    keywords: ["conseil", "stratégie", "strategie", "accompagnement", "consulting", "transformation digitale", "performance"],
    weight: 1.2,
  },
  {
    intent: "SOLUTION",
    keywords: ["solution", "iot", "embarqué", "embarque", "supervision", "data", "custom", "développement", "projet", "ingénieur"],
    weight: 1.2,
  },
  {
    intent: "CERTIFICATION",
    keywords: ["certification", "certifié", "certifie", "certifier", "examen", "test certification", "istqb", "accréditation"],
    weight: 1.3,
  },
  {
    intent: "CONTACT",
    keywords: ["contact", "adresse", "téléphone", "telephone", "email", "mail", "joindre", "appeler", "localisation", "où", "ou"],
    weight: 1.2,
  },
  {
    intent: "PARTENAIRES",
    keywords: ["partenaire", "partenaires", "collaboration", "entreprise", "telnet", "sofiatech", "faurecia", "altran"],
    weight: 1.2,
  },
  {
    intent: "PRIX",
    keywords: ["prix", "tarif", "tarifs", "coût", "cout", "combien", "gratuit", "paiement", "financement", "budget"],
    weight: 1.3,
  },
  {
    intent: "INSCRIPTION",
    keywords: ["inscription", "inscrire", "s'inscrire", "sinscrire", "postuler", "candidature", "rejoindre", "catalogue"],
    weight: 1.2,
  },
]

const ENTITY_PATTERNS: Record<string, RegExp> = {
  optimum: /\boptimum\b/i,
  silver: /\bsilver\b/i,
  gold: /\bgold\b/i,
  microcontroller: /\b(microcontr[oô]leur|microcontroller|cortex-m)\b/i,
  processor: /\b(processeur|processor|x86)\b/i,
  embarque: /\b(embarqu[eé]|embedded|stm32|arm)\b/i,
  fullstack: /\b(full[\s-]?stack|react|node\.?js)\b/i,
  testeur: /\b(testeur|test|istqb|qa)\b/i,
  iot: /\b(iot|internet des objets|mqtt)\b/i,
  certification: /\b(certification|certifi[eé])\b/i,
}

export function detectIntent(message: string): IntentResult {
  const normalized = normalize(message)
  const entities = extractEntities(message)

  const scores: { intent: ChatIntent; score: number }[] = []

  for (const pattern of INTENT_PATTERNS) {
    let score = 0
    for (const keyword of pattern.keywords) {
      if (normalized.includes(normalize(keyword))) {
        score += pattern.weight
      }
    }
    if (score > 0) {
      scores.push({ intent: pattern.intent, score })
    }
  }

  if (entities.includes("optimum") || entities.includes("silver") || entities.includes("gold")) {
    scores.push({ intent: "CURSUS_DETAIL", score: 2 })
  }

  scores.sort((a, b) => b.score - a.score)

  if (scores.length === 0) {
    return { intent: "UNKNOWN", confidence: 0, entities }
  }

  const top = scores[0]
  const maxPossible = INTENT_PATTERNS.find((p) => p.intent === top.intent)?.keywords.length ?? 1
  const confidence = Math.min(top.score / maxPossible, 1)

  return {
    intent: top.intent,
    confidence,
    entities,
  }
}

function extractEntities(message: string): string[] {
  const entities: string[] = []
  for (const [name, pattern] of Object.entries(ENTITY_PATTERNS)) {
    if (pattern.test(message)) {
      entities.push(name)
    }
  }
  return entities
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}
