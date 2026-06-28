import { ConseilCard } from "@/components/website/cards/conseil-card"
import { AmbitionCard } from "@/components/website/cards/ambition-card"

const conseilItems = [
  {
    id: 1,
    title: "Stratégie & Partenariats",
    description:
      "Nous définissons votre vision en nous appuyant sur un écosystème de partenaires leaders pour garantir des résultats concrets.",
    iconUrl: "/images/partenariat1.png",
  },
  {
    id: 2,
    title: "Transformation Digitale",
    description:
      "Pilotez votre transformation avec les meilleures technologies du marché pour optimiser vos processus internes.",
    iconUrl: "/images/digital1.png",
  },
  {
    id: 3,
    title: "Performance Opérationnelle",
    description:
      "Un conseil de haut niveau pour booster votre productivité et transformer vos ambitions en succès opérationnels.",
    iconUrl: "/images/performance1.png",
  },
  {
    id: 4,
    title: "Développement du Potentiel",
    description:
      "Orientation et amélioration des compétences pour les porteurs de projets souhaitant propulser leur parcours professionnel.",
    iconUrl: "/images/potentiel1.png",
  },
]

export function PoleConseilSection() {
  return (
    <section
      id="consulting"
      className="scroll-mt-24 bg-white px-4 py-10 md:px-8 md:py-20 lg:px-16"
      data-nav-bg="#ffffff"
      data-nav-tone="light"
    >
      <div className="mx-auto max-w-7xl min-w-0">
        <div className="text-center mb-12">
          <h2 className="mt-10 mb-4 text-balance break-words text-2xl font-bold text-[#0D2A61] sm:mt-14 sm:text-3xl md:text-4xl lg:text-5xl">
            Pôle Conseil : Accompagnement Stratégique 
          </h2>
          <p className="mx-auto mb-12 max-w-5xl text-balance break-words text-base text-[#0A285E] md:mb-20 md:text-xl lg:text-2xl">
            Passer de l&apos;idée à la production avec une stratégie technologique maîtrisée.
          </p>
        </div>

        <div className="mb-20 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2">
            {conseilItems.map((item) => (
              <ConseilCard
                key={item.id}
                title={item.title}
                description={item.description}
                iconUrl={item.iconUrl}
              />
            ))}
          </div>

          <div className="min-h-0 min-w-0 md:col-span-1">
            <AmbitionCard
              title="Prêt à transformer vos ambitions ?"
              imageUrl="/images/ambition-image1.jpg"
              buttonText="Bénéficier de l'expertise CSF"
            />
          </div>
        </div>
      </div>
    </section>
  )
}