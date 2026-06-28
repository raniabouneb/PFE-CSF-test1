import { KnowledgeEntry } from "./types";

export const CSF_KNOWLEDGE_BASE: Record<string, KnowledgeEntry> = {
  about: {
    title: "À propos de CSF",
    content: "CSF (Conseil · Solution · Formation) est un expert en ingénierie informatique spécialisé dans les systèmes embarqués, l'IoT, le développement web et la data. Nous accompagnons nos clients à travers trois pôles : le Conseil stratégique, le développement de Solutions sur mesure, et la Formation continue.",
    keywords: ["csf", "c'est quoi", "qui êtes vous", "qui sommes nous", "présentation", "société", "entreprise"]
  },
  contact: {
    title: "Contact",
    content: "Vous pouvez nous contacter par email à **contact@csf.com** ou par téléphone au **01 23 45 67 89**. Nos bureaux sont situés à Paris.",
    keywords: ["contact", "contacter", "téléphone", "email", "adresse", "joindre", "où"],
    link: "/contact"
  },
  formations: {
    title: "Nos Formations",
    content: "CSF propose plusieurs types de formations : \n- Des **cursus de reconversion** intensifs (Optimum, Silver, Gold)\n- Des **modules courts** pour monter en compétence sur une technologie spécifique (C++, Rust, RTOS, React...)\n- Des **mini-packs** thématiques (Microcontrôleur, Processeur...)",
    keywords: ["formation", "formations", "apprendre", "cours", "catalogue"],
    link: "/formation"
  },
  reconversion: {
    title: "Cursus de Reconversion",
    content: "Nous proposons 3 cursus de reconversion spécialisés dans l'embarqué et l'IoT :\n- **Cursus OPTIMUM** : Le programme complet pour devenir ingénieur systèmes embarqués.\n- **Cursus SILVER** : Focus sur l'IoT et les systèmes connectés.\n- **Cursus GOLD** : Pour les profils visant l'architecture et le lead technique.\nSouhaitez-vous analyser votre CV pour voir quel cursus vous correspondrait le mieux ?",
    keywords: ["reconversion", "changer de métier", "cursus", "bootcamp", "optimum", "silver", "gold"]
  },
  conseil: {
    title: "Pôle Conseil",
    content: "Notre pôle Conseil vous accompagne dans vos choix technologiques, l'architecture de vos systèmes, l'audit de code, et la stratégie IoT. Nous mettons à disposition des experts seniors pour vous guider.",
    keywords: ["conseil", "consulting", "audit", "architecture", "stratégie", "accompagnement"]
  },
  solution: {
    title: "Pôle Solution",
    content: "Le pôle Solution réalise vos projets de A à Z : développement de cartes électroniques, firmware, drivers Linux, applications web IoT, et cloud. Nous sommes un bureau d'études complet.",
    keywords: ["solution", "projet", "développement", "bureau d'études", "réalisation", "firmware", "iot"]
  },
  certifications: {
    title: "Certifications",
    content: "Nos formations préparent à des certifications reconnues par l'État et l'industrie (RNCP, certifications éditeurs). Nous sommes un organisme de formation certifié Qualiopi.",
    keywords: ["certification", "certifié", "qualiopi", "diplôme", "rncp", "reconnu"]
  },
  partenaires: {
    title: "Partenaires",
    content: "CSF travaille avec des partenaires de renom dans l'industrie technologique : STMicroelectronics, NXP, AWS, et de nombreuses entreprises qui recrutent nos stagiaires.",
    keywords: ["partenaire", "partenaires", "entreprise", "réseau", "stmicroelectronics", "nxp"]
  },
  prix: {
    title: "Tarifs et Financement",
    content: "Nos tarifs varient selon les modules et cursus. Des financements sont possibles (CPF, OPCO, Pôle Emploi, Région). Contactez-nous pour un devis personnalisé.",
    keywords: ["prix", "tarif", "coût", "combien", "financement", "cpf", "opco", "devis"]
  },
  inscription: {
    title: "Inscription",
    content: "Pour vous inscrire, vous pouvez remplir le formulaire sur la page de la formation qui vous intéresse ou nous contacter directement. Un entretien préalable est souvent requis pour les cursus longs.",
    keywords: ["inscription", "inscrire", "postuler", "candidature", "comment s'inscrire"]
  }
};
