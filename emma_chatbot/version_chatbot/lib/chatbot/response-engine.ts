import { ChatIntent } from "./types";
import { CSF_KNOWLEDGE_BASE } from "./knowledge-base";
import { detectIntent } from "./intent-detector";

export function generateResponse(message: string): string {
  const intent: ChatIntent = detectIntent(message);

  switch (intent) {
    case "GREETING":
      return `Bonjour ! Je suis l'assistant IA de CSF. 👋\n\nComment puis-je vous aider aujourd'hui ?\n${CSF_KNOWLEDGE_BASE.about.content}\n\nVous pouvez me poser des questions sur nos formations, nos services de conseil, ou même me demander d'analyser votre CV !`;
    
    case "FORMATION_GENERAL":
      return `${CSF_KNOWLEDGE_BASE.formations.content}\n\nPourriez-vous me préciser quel domaine vous intéresse le plus ?`;
      
    case "RECONVERSION":
      return `${CSF_KNOWLEDGE_BASE.reconversion.content}\n\nN'hésitez pas à utiliser le bouton 📎 ci-dessous pour m'envoyer votre CV au format PDF, je l'analyserai pour vous conseiller.`;
      
    case "CURSUS_DETAIL":
      return `Nous avons 3 cursus principaux pour la reconversion dans l'embarqué :\n\n- **OPTIMUM** : Destiné aux débutants ou personnes souhaitant tout reprendre depuis la base.\n- **SILVER** : Parfait pour les profils ayant déjà une expérience de base et souhaitant se spécialiser en IoT.\n- **GOLD** : Pour les profils plus expérimentés souhaitant évoluer vers l'architecture de systèmes embarqués.\n\nLequel attise votre curiosité ?`;
      
    case "CONSEIL":
      return `${CSF_KNOWLEDGE_BASE.conseil.content}\n\nPour discuter d'un projet, le mieux est de nous [contacter](${CSF_KNOWLEDGE_BASE.contact.link}).`;
      
    case "SOLUTION":
      return `${CSF_KNOWLEDGE_BASE.solution.content}\n\nAvez-vous un projet spécifique en tête ?`;
      
    case "CERTIFICATION":
      return `${CSF_KNOWLEDGE_BASE.certifications.content}`;
      
    case "CONTACT":
      return `${CSF_KNOWLEDGE_BASE.contact.content}`;
      
    case "CV_ANALYSIS":
      return `Vous souhaitez que j'analyse votre CV ? C'est une excellente idée ! 🚀\n\nVeuillez cliquer sur l'icône trombone 📎 en bas à gauche de la zone de saisie pour uploader votre CV au format PDF. Je l'analyserai et vous recommanderai le meilleur cursus CSF pour votre profil.`;
      
    case "PARTENAIRES":
      return `${CSF_KNOWLEDGE_BASE.partenaires.content}`;
      
    case "PRIX":
      return `${CSF_KNOWLEDGE_BASE.prix.content}`;
      
    case "INSCRIPTION":
      return `${CSF_KNOWLEDGE_BASE.inscription.content}`;
      
    case "UNKNOWN":
    default:
      return "Je ne suis pas sûr d'avoir bien compris. 🤔\n\nVous pouvez me demander des informations sur nos **formations**, nos cursus de **reconversion**, ou nous **contacter**. Vous pouvez aussi m'envoyer votre CV (bouton 📎) pour une recommandation personnalisée !";
  }
}
