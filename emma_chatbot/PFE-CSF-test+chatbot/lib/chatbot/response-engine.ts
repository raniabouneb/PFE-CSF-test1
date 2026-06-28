import type { ChatbotResponse, ChatIntent } from "./types"
import { detectIntent } from "./intent-detector"
import {
  CSF_INFO,
  POLES,
  CURSUS,
  RECONVERSION_TRACKS,
  MINI_PACKS,
  EMBEDDED_MODULES,
  PONCTUELLE_TOPICS,
  CERTIFICATIONS,
  PARTNERS,
  FAQ,
  searchKnowledge,
} from "./knowledge-base"

export function generateResponse(userMessage: string): ChatbotResponse {
  const { intent, entities } = detectIntent(userMessage)
  const relevantEntries = searchKnowledge(userMessage, 3)

  let message: string
  let suggestions: string[]

  switch (intent) {
    case "GREETING":
      message = buildGreeting()
      suggestions = ["📚 Formations disponibles", "🔄 Reconversion métier", "📄 Analyser mon CV", "📞 Contact"]
      break
    case "FORMATION_GENERAL":
      message = buildFormationResponse(entities, relevantEntries)
      suggestions = ["Formations ponctuelles", "Modules embarqués", "Parcours sur-mesure", "Certifications"]
      break
    case "RECONVERSION":
      message = buildReconversionResponse(entities)
      suggestions = ["Cursus OPTIMUM", "Cursus SILVER", "Cursus GOLD", "📄 Analyser mon CV"]
      break
    case "CURSUS_DETAIL":
      message = buildCursusDetailResponse(entities)
      suggestions = ["Mini Pack Microcontrôleur", "Mini Pack Processeur", "S'inscrire", "Contact"]
      break
    case "CONSEIL":
      message = buildPoleResponse("conseil")
      suggestions = ["Pôle Solution", "Pôle Formation", "Lancer un projet", "Contact"]
      break
    case "SOLUTION":
      message = buildPoleResponse("solution")
      suggestions = ["IoT & Embarqué", "Supervision & Data", "Demander un devis", "Contact"]
      break
    case "CERTIFICATION":
      message = buildCertificationResponse()
      suggestions = ["Formation embarquée", "Full Stack", "S'inscrire à une certification", "Contact"]
      break
    case "CONTACT":
      message = buildContactResponse()
      suggestions = ["Formations", "Reconversion", "Certifications", "Partenaires"]
      break
    case "CV_ANALYSIS":
      message = buildCVAnalysisPrompt()
      suggestions = ["📄 Analyser mon CV", "Cursus OPTIMUM", "Reconversion métier", "Contact"]
      break
    case "PARTENAIRES":
      message = buildPartnersResponse()
      suggestions = ["Formations", "Pôle Conseil", "Pôle Solution", "Contact"]
      break
    case "PRIX":
      message = buildPricingResponse()
      suggestions = ["Demander un devis", "Formations ponctuelles", "Reconversion", "Contact"]
      break
    case "INSCRIPTION":
      message = buildInscriptionResponse()
      suggestions = ["Reconversion métier", "Formations ponctuelles", "Certifications", "Contact"]
      break
    default:
      message = buildFallbackResponse(userMessage, relevantEntries)
      suggestions = ["📚 Formations disponibles", "🔄 Reconversion métier", "📞 Contact", "Certifications"]
  }

  return { message, suggestions, intent }
}

function buildGreeting(): string {
  return `Bonjour ! Je suis l'**Assistant CSF** 🤖

Je peux vous renseigner sur :
• Nos **formations** et parcours de **reconversion**
• Les cursus **OPTIMUM**, **SILVER** et **GOLD**
• Nos **certifications** professionnelles
• Le **pôle Conseil** et **Solution**
• Nos **partenaires** et comment nous **contacter**

Vous pouvez aussi **uploader votre CV** (PDF) pour obtenir une recommandation de parcours personnalisée !

Comment puis-je vous aider ?`
}

function buildFormationResponse(entities: string[], entries: ReturnType<typeof searchKnowledge>): string {
  let response = `**Pôle Formation — Expertise & Transmission**\n\n${POLES.formation.description}\n\n`

  response += `**Nos formats de formation :**\n`
  for (const format of POLES.formation.formats) {
    response += `• [**${format.title}**](${format.link}) — ${format.description}\n`
  }

  response += `\n**Modules embarqués disponibles :**\n`
  for (const mod of EMBEDDED_MODULES.slice(0, 4)) {
    response += `• ${mod.title} (${mod.duration})\n`
  }

  response += `\n**Formations ponctuelles** — 56 modules experts dans : ${PONCTUELLE_TOPICS.join(", ")}.\n`
  response += `[Voir les formations ponctuelles](/formations-ponctuelles)`

  if (entries.length > 0 && entities.length > 0) {
    response += `\n\n**Info complémentaire :**\n${entries[0].content}`
  }

  return response
}

function buildReconversionResponse(entities: string[]): string {
  let response = `**Reconversion Professionnelle — CSF-RCP®**\n\n`
  response += `Changez de carrière avec nos cursus intensifs. CSF est le **premier en Tunisie** à proposer une formation de reconstitution de carrière professionnelle.\n\n`

  response += `**Nos parcours de reconversion :**\n`
  for (const track of RECONVERSION_TRACKS) {
    response += `• [**${track.title}**](${track.link})\n  ${track.description}\n`
  }

  response += `\n**Cursus Système Embarqué (OPTIMUM / SILVER / GOLD) :**\n`
  for (const cursus of CURSUS) {
    response += `• **${cursus.name}** — ${cursus.title}\n`
  }

  if (entities.includes("embarque")) {
    const track = RECONVERSION_TRACKS[0]
    response += `\n**Focus Système Embarqué :** ${track.stats?.modules}, ${track.stats?.labs}, ${track.stats?.projects}.\n`
    response += `[En savoir plus](${track.link})`
  }

  response += `\n\n💡 **Astuce :** Uploadez votre CV pour une recommandation personnalisée !`

  return response
}

function buildCursusDetailResponse(entities: string[]): string {
  const cursusId = entities.find((e) => ["optimum", "silver", "gold"].includes(e))
  const packId = entities.find((e) => ["microcontroller", "processor"].includes(e))

  if (packId) {
    const pack = MINI_PACKS.find((p) => p.id === packId) ?? MINI_PACKS[0]
    return `**Mini Pack ${pack.title}**\n\nSpécialisez-vous rapidement avec ce programme ciblé :\n\n${pack.modules.map((m) => `• ${m}`).join("\n")}\n\n[S'inscrire](/formation/reconversion/systeme-embarque)`
  }

  const cursus = cursusId
    ? CURSUS.find((c) => c.id === cursusId)
    : null

  if (cursus) {
    return `**${cursus.name} — ${cursus.title}**\n\n${cursus.description}\n\n**Modules (${cursus.modules.length}) :**\n${cursus.modules.map((m) => `• ${m}`).join("\n")}\n\n[Voir le parcours complet](${cursus.link})`
  }

  let response = `**Parcours de Reconversion — 3 Cursus Intensifs**\n\n`
  for (const c of CURSUS) {
    response += `**${c.name}** — ${c.title}\n${c.description}\n${c.modules.length} modules\n\n`
  }

  response += `**Mini Packs :** Microcontrôleur & Processeur\n`
  response += `[Découvrir les parcours](/formation/reconversion/systeme-embarque)`

  return response
}

function buildPoleResponse(pole: "conseil" | "solution"): string {
  const data = POLES[pole]
  const services = data.services ?? []

  let response = `**${data.title} — ${data.subtitle}**\n\n${data.description}\n\n`
  for (const service of services) {
    response += `• **${service.title}** — ${service.description}\n`
  }

  if (pole === "solution") {
    response += `\n[Nos experts analysent vos besoins](${data.link}) pour déployer des solutions sur mesure.`
  } else {
    response += `\n[En savoir plus](${data.link})`
  }

  return response
}

function buildCertificationResponse(): string {
  let response = `**Certifications Professionnelles CSF**\n\n`
  response += `Valorisez votre expertise avec des certifications reconnues par l'industrie.\n`
  response += `• **24+** certifications disponibles\n`
  response += `• **4 800+** certifiés\n`
  response += `• **96%** de taux de réussite\n\n`
  response += `Vous pouvez passer nos tests de certification **directement en ligne** !\n\n`

  response += `**Catalogue :**\n`
  for (const cert of CERTIFICATIONS) {
    response += `• **${cert.title}** (${cert.level}) — ${cert.duration}\n  Compétences : ${cert.skills.join(", ")}\n`
  }

  response += `\n[Voir toutes les certifications](/certifications)`

  return response
}

function buildContactResponse(): string {
  return `**Contactez CSF**\n\n`
    + `📧 **Email :** [${CSF_INFO.email}](mailto:${CSF_INFO.email})\n`
    + `📞 **Téléphone :** [${CSF_INFO.phone}](tel:+21698765432)\n`
    + `📍 **Adresse :** ${CSF_INFO.address}\n\n`
    + `Notre équipe est disponible pour répondre à toutes vos questions sur nos formations, solutions et services de conseil.\n\n`
    + `[Accéder à la section contact](/#contact)`
}

function buildCVAnalysisPrompt(): string {
  return `**Analyse de CV — Recommandation de Parcours**\n\n`
    + `Je peux analyser votre CV (format PDF) pour :\n`
    + `• Extraire vos **compétences techniques**\n`
    + `• Évaluer votre profil par domaine (Embarqué, Web, IoT, Data…)\n`
    + `• Recommander le **cursus CSF** le plus adapté (OPTIMUM, SILVER, GOLD…)\n\n`
    + `👉 Cliquez sur l'icône **📎** en bas du chat pour uploader votre CV PDF.\n\n`
    + `L'analyse est effectuée **localement** sur nos serveurs, sans API externe.`
}

function buildPartnersResponse(): string {
  return `**Nos Partenaires**\n\n`
    + `CSF collabore avec des leaders de l'industrie pour garantir l'excellence de nos formations et solutions.\n\n`
    + `**Partenaires :** ${PARTNERS.join(", ")}\n\n`
    + `📊 **${CSF_INFO.stats.partnersCount}+** partenaires\n`
    + `📊 **${CSF_INFO.stats.projectsCompleted}+** projets réalisés\n`
    + `📊 **${CSF_INFO.stats.yearsOfExperience}** ans d'expérience\n\n`
    + `Exemple de collaboration : formation spécialisée en architecture et programmation des microcontrôleurs STM32 avec Capgemini Engineering Tunisia et GIZ Tunisie.\n\n`
    + `[Voir nos partenaires](/#partenaires)`
}

function buildPricingResponse(): string {
  return `**Tarifs & Financement**\n\n`
    + `Les tarifs de nos formations varient selon le format choisi :\n`
    + `• **Formation ponctuelle** — à la carte, par module\n`
    + `• **Reconversion CSF-RCP** — cursus complets (OPTIMUM, SILVER, GOLD)\n`
    + `• **Parcours sur-mesure** — programme personnalisé\n`
    + `• **Certifications** — tests en ligne disponibles\n\n`
    + `Pour obtenir un **devis personnalisé**, contactez-nous :\n`
    + `📧 [${CSF_INFO.email}](mailto:${CSF_INFO.email})\n`
    + `📞 [${CSF_INFO.phone}](tel:+21698765432)\n\n`
    + `[Demander un devis](/formation?open=parcours)`
}

function buildInscriptionResponse(): string {
  return `**Comment s'inscrire ?**\n\n`
    + `1. **Reconversion** — Choisissez votre parcours sur [notre page Formation](/formation?open=reconversion)\n`
    + `2. **Formation ponctuelle** — Parcourez nos [56 modules experts](/formations-ponctuelles)\n`
    + `3. **Certification** — Inscrivez-vous sur [notre page Certifications](/certifications)\n`
    + `4. **Parcours sur-mesure** — Remplissez le [formulaire de besoin](/formation?open=parcours)\n\n`
    + `Ou contactez-nous directement :\n`
    + `📧 [${CSF_INFO.email}](mailto:${CSF_INFO.email}) | 📞 [${CSF_INFO.phone}](tel:+21698765432)`
}

function buildFallbackResponse(userMessage: string, entries: ReturnType<typeof searchKnowledge>): string {
  if (entries.length > 0) {
    const best = entries[0]
    let response = `Voici ce que j'ai trouvé concernant **${best.title}** :\n\n${best.content}`
    if (best.link) {
      response += `\n\n[En savoir plus](${best.link})`
    }
    if (entries.length > 1) {
      response += `\n\n**Autres résultats :**\n`
      for (const entry of entries.slice(1)) {
        response += `• ${entry.title}${entry.link ? ` — [détails](${entry.link})` : ""}\n`
      }
    }
    return response
  }

  const faqMatch = FAQ.find((f) =>
    userMessage.toLowerCase().split(" ").some((word) => f.question.toLowerCase().includes(word) && word.length > 3),
  )

  if (faqMatch) {
    return `**${faqMatch.question}**\n\n${faqMatch.answer}`
  }

  return `Je n'ai pas trouvé de réponse précise à votre question. Voici ce que je peux vous aider à trouver :\n\n`
    + `• Nos **formations** et modules ([/formation](/formation))\n`
    + `• La **reconversion professionnelle** CSF-RCP\n`
    + `• Nos **certifications** ([/certifications](/certifications))\n`
    + `• Nos **coordonnées** ([contact](/#contact))\n\n`
    + `Reformulez votre question ou choisissez une suggestion ci-dessous !`
}

export function formatCVAnalysisResult(result: import("./types").CVAnalysisResult): string {
  if (!result.success) {
    return `❌ **Erreur d'analyse**\n\n${result.error ?? "Impossible d'analyser le fichier."}\n\nAssurez-vous d'uploader un fichier PDF valide.`
  }

  let message = `✅ **Analyse de CV terminée**\n\n`

  if (result.skills.length > 0) {
    message += `**Compétences détectées (${result.skills.length}) :**\n`
    const byDomain = groupByDomain(result.skills)
    for (const [domain, skills] of Object.entries(byDomain)) {
      message += `\n**${domain} :** ${skills.map((s) => s.skill).join(", ")}\n`
    }
  } else {
    message += `Aucune compétence technique spécifique détectée. Cela peut arriver si le CV est scanné ou peu détaillé.\n`
  }

  if (result.primaryRecommendation) {
    const rec = result.primaryRecommendation
    message += `\n**🎯 Recommandation principale : ${rec.name}**\n`
    message += `**${rec.title}** — ${rec.matchPercentage}% de compatibilité\n`
    message += `${rec.reason}\n`
    message += `[Voir le parcours](${rec.link})\n`
  }

  if (result.recommendations.length > 1) {
    message += `\n**Autres parcours suggérés :**\n`
    for (const rec of result.recommendations.slice(1, 4)) {
      message += `• **${rec.name}** — ${rec.matchPercentage}% — ${rec.title}\n`
    }
  }

  if (result.advice.length > 0) {
    message += `\n**Conseils personnalisés :**\n`
    for (const tip of result.advice) {
      message += `• ${tip}\n`
    }
  }

  return message
}

function groupByDomain(skills: import("./types").SkillMatch[]): Record<string, import("./types").SkillMatch[]> {
  const groups: Record<string, import("./types").SkillMatch[]> = {}
  for (const skill of skills) {
    if (!groups[skill.domain]) groups[skill.domain] = []
    groups[skill.domain].push(skill)
  }
  return groups
}

export function generateCVSuggestions(): string[] {
  return ["Cursus OPTIMUM", "Cursus SILVER", "S'inscrire", "Contact"]
}
