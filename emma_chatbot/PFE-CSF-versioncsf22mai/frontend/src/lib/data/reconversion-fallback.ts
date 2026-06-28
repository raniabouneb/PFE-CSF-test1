import type { ReconversionHorsPackModuleCard, ReconversionPackDTO, ReconversionTopicPageData } from "@/lib/types/reconversion"

/** Contenu statique identique à l’ancien code embarqué — utilisé si la BD est vide. */
export function getStaticSystemeEmbarqueData(): ReconversionTopicPageData {
  const fullPacks: ReconversionPackDTO[] = [
    {
      variantSlug: "optimum",
      styleKey: "optimum",
      tabLabel: "OPTIMUM",
      badgeLabel: "OPTIMUM",
      cardTitle: "CSF-RCP - Développement en Système Embarqué",
      imageUrl: "/images/pack/image1.jpeg",
      modules: [
        { text: "L'essentiel du langage C pour embarqué", kind: "course" },
        { text: "Langage C pour les systèmes embarqués", kind: "course" },
        { text: "Architecture et programmation des uC STM32", kind: "course" },
        { text: "Projet IoT sur STM32", kind: "project" },
        { text: "La programmation orientée objets en C++", kind: "course" },
        { text: "IHM QT pour les systèmes embarqués", kind: "course" },
        { text: "Projet IHM sur Arduino", kind: "project" },
        { text: "Linux embarqué et programmation Shell", kind: "course" },
        { text: "« Kernelspace » et intégration des drivers", kind: "course" },
        { text: "Programmation sur environnement Linux", kind: "course" },
        { text: "Projet IoT sur Raspberry Pi", kind: "project" },
        { text: "Stage de Projet de Fin de Formation", kind: "project" },
      ],
    },
    {
      variantSlug: "silver",
      styleKey: "silver",
      tabLabel: "SILVER",
      badgeLabel: "SILVER",
      cardTitle: "RTOS & Protocoles - Systèmes Temps Réel",
      imageUrl: "/images/pack/image3-1.jpg",
      modules: [
        { text: "RTOS FreeRTOS et µC/OS-III", kind: "course" },
        { text: "Synchronisation et communication inter-tâches", kind: "course" },
        { text: "Protocoles CAN, Modbus et MQTT", kind: "course" },
        { text: "Gestion de la mémoire en temps réel", kind: "course" },
        { text: "Debugging et optimisation performante", kind: "course" },
        { text: "Projet : Système multi-tâches temps réel", kind: "project" },
        { text: "Stage projet avancé", kind: "project" },
      ],
    },
    {
      variantSlug: "gold",
      styleKey: "gold",
      tabLabel: "GOLD",
      badgeLabel: "GOLD",
      cardTitle: "IoT Avancé & Cloud - Écosystème Connecté",
      imageUrl: "/images/pack/image6.jpg",
      modules: [
        { text: "Architecture IoT en couches", kind: "course" },
        { text: "MQTT, CoAP et protocoles légers", kind: "course" },
        { text: "Intégration Azure IoT Hub et AWS IoT", kind: "course" },
        { text: "Processing et analytics en temps réel", kind: "course" },
        { text: "Edge computing et IA sur microcontroleurs", kind: "course" },
        { text: "Sécurité et cryptographie pour IoT", kind: "course" },
        { text: "Projet : Plateforme IoT complète", kind: "project" },
        { text: "Stage projet enterprise", kind: "project" },
      ],
    },
  ]

  const miniPacks: ReconversionPackDTO[] = [
    {
      variantSlug: "microcontroleur",
      styleKey: "microcontroller",
      tabLabel: "Microcontrôleur",
      badgeLabel: "MICROCONTRÔLEUR",
      cardTitle: "Microcontrôleur",
      imageUrl: "/images/pack/kkk.jpeg",
      modules: [
        { text: "L'essentiel de langage C pour embarqué", kind: "course" },
        { text: "Langage C pour les systèmes embarqués", kind: "course" },
        { text: "Architecture et programmation des microcontrôleurs STM32", kind: "course" },
        { text: "Noyaux Temps Réel Multitâches - FreeRTOS", kind: "course" },
        { text: "La programmation orientée objets en C++", kind: "course" },
        { text: "IHM QT pour les systèmes embarqués", kind: "course" },
        { text: "Culture professionnelle et retour d'expérience", kind: "course" },
        { text: "Stage de Projet de Fin de Formation (1 Mois)", kind: "project" },
      ],
    },
    {
      variantSlug: "processeur",
      styleKey: "processor",
      tabLabel: "Processeur",
      badgeLabel: "PROCESSEUR",
      cardTitle: "Processeur",
      imageUrl: "/images/pack/whatsapp-03.jpeg",
      modules: [
        { text: "La programmation orientée objets en C++", kind: "course" },
        { text: "IHM QT pour les systèmes embarqués", kind: "course" },
        { text: "Linux embarqué et programmation Shell", kind: "course" },
        { text: "« Kernelspace » et Intégration des drivers", kind: "course" },
        { text: "Programmation sur environnement Linux", kind: "course" },
        { text: "Culture professionnelle et retour d'expérience", kind: "course" },
        { text: "Stage de Projet de Fin de Formation (1 Mois)", kind: "project" },
      ],
    },
  ]

  const goldFullPack = fullPacks.find((p) => p.styleKey === "gold")
  const packDetailModules: ReconversionHorsPackModuleCard[] = goldFullPack
    ? goldFullPack.modules.map((m, i) => ({
        id: `static-gold-${i}`,
        title: m.text,
        kind: m.kind,
        imageUrl: goldFullPack.imageUrl,
        description: m.text,
        certified: true,
      }))
    : []

  return {
    slug: "systeme-embarque",
    hero: {
      title: "Formation Professionnelle en Système Embarqué",
      subtitle:
        "Formation professionnelle animée par des experts industriels pour former les futurs professionnels !",
      backgroundImageUrl: "/images/pack/whatsapp-0.jpeg",
    },
    stats: [
      { label: "Formation", value: "16 modules" },
      { label: "Pratique", value: "70 Lab" },
      { label: "Projets", value: "4 Projets réels IoT" },
      {
        label: "Programmes d'entraînement",
        value: "+1000 exercices",
        description: "avec réponses & explications",
      },
      {
        label: "Coaching privé",
        value: "4 réunions",
        description: "individuelles/Mois",
      },
      { label: "Evaluation", value: "11 examens" },
    ],
    fullPacks,
    miniPacks,
    packDetailModules,
    horsPackModules: [],
  }
}
