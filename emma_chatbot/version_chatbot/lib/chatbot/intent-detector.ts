import { ChatIntent } from "./types";

const INTENT_PATTERNS: Record<ChatIntent, RegExp[]> = {
  GREETING: [/bonjour/i, /salut/i, /coucou/i, /hello/i, /hey/i, /bonsoir/i],
  FORMATION_GENERAL: [/formation/i, /apprendre/i, /cours/i, /enseigner/i, /catalogue/i],
  RECONVERSION: [/reconversion/i, /changer de métier/i, /bootcamp/i, /nouveau métier/i, /carrière/i],
  CURSUS_DETAIL: [/optimum/i, /silver/i, /gold/i, /cursus/i, /programme complet/i],
  CONSEIL: [/conseil/i, /audit/i, /consultant/i, /accompagnement/i, /stratégie/i],
  SOLUTION: [/solution/i, /développement/i, /projet/i, /bureau d'étude/i, /réaliser/i, /créer.*application/i],
  CERTIFICATION: [/certification/i, /certificat/i, /diplôme/i, /reconnu/i, /qualiopi/i, /rncp/i],
  CONTACT: [/contact/i, /téléphone/i, /email/i, /mail/i, /adresse/i, /joindre/i, /appeler/i, /où/i],
  CV_ANALYSIS: [/cv/i, /curriculum/i, /analyser/i, /mon profil/i, /compétences/i, /parcours.*adapté/i],
  PARTENAIRES: [/partenaire/i, /entreprise/i, /collaboration/i, /stmicro/i, /nxp/i],
  PRIX: [/prix/i, /tarif/i, /coût/i, /combien/i, /financement/i, /cpf/i, /payer/i],
  INSCRIPTION: [/inscription/i, /inscrire/i, /postuler/i, /candidature/i, /rejoindre/i],
  UNKNOWN: []
};

export function detectIntent(message: string): ChatIntent {
  let detectedIntent: ChatIntent = "UNKNOWN";
  let maxMatches = 0;

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let matches = 0;
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        matches++;
      }
    }
    
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedIntent = intent as ChatIntent;
    }
  }

  // Fallbacks logic if needed based on specific word combinations
  if (detectedIntent === "UNKNOWN") {
    // try to find something based on generic keywords if Regex didn't catch perfectly
    if (message.toLowerCase().includes("csf")) return "GREETING"; // Could be asking about csf
  }

  return detectedIntent;
}
