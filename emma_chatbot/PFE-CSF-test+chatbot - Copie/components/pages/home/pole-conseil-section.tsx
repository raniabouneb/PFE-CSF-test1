import { ConseilCard } from "@/components/shared/cards/conseil-card"
import { AmbitionsCard } from "@/components/shared/cards/ambitions-card"

const conseilItems = [
  {
    id: 1,
    title: "Stratégie & Partenariats",
    description: "Nous définissons votre vision en nous appuyant sur un écosystème de partenaires leaders pour garantir des résultats concrets.",
    iconUrl: "/images/icons/strategie-icon.jpg",
  },
  {
    id: 2,
    title: "Transformation Digitale",
    description: "Pilotez votre transformation avec les meilleures technologies du marché pour optimiser vos processus internes.",
    iconUrl: "/images/icons/transformation-icon.jpg",
  },
  {
    id: 3,
    title: "Performance Opérationnelle",
    description: "Un conseil de haut niveau pour booster votre productivité et transformer vos ambitions en succès opérationnels.",
    iconUrl: "/images/icons/performance-icon.jpg",
  },
  {
    id: 4,
    title: "Développement du Potentiel",
    description: "Orientation et amélioration des compétences pour les porteurs de projets souhaitant propulser leur parcours professionnel.",
    iconUrl: "/images/icons/potentiel-icon.jpg",
  },
]

export function PoleConseilSection() {
  return (
    <section id="consulting" className="py-16 px-4 md:px-8 lg:px-16 bg-white scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F6CA3] mb-4">
            Pôle Conseil : Accompagnement stratégique sur Mesure
          </h2>
          <p className="text-[#335FA1] max-w-2xl mx-auto text-base md:text-lg">
            Passer de l'idée à la production avec une stratégie technologique maîtrisée.
          </p>
        </div>

        {/* Grid Layout: 4 cards on left (2x2), 1 tall card on right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left side: 2x2 grid of conseil cards */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {conseilItems.map((item) => (
              <ConseilCard
                key={item.id}
                title={item.title}
                description={item.description}
                iconUrl={item.iconUrl}
              />
            ))}
          </div>

          {/* Right side: Tall ambitions card */}
          <div className="md:col-span-1">
            <AmbitionsCard
              title="Prêt à transformer vos ambitions ?"
              imageUrl="/images/ambition-image1.jpg"
              buttonText="En savoir plus"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
