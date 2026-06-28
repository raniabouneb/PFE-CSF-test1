import { ReconversionCard } from "@/components/shared/cards/reconversion-card"
import { FormationCard } from "@/components/shared/cards/formation-card"
import { CertificationCard } from "@/components/shared/cards/certification-card"

export function PoleSolutionSection() {
  return (
    <section id="solution" className="py-16 px-4 md:px-8 lg:px-16 bg-[#F7FCFC] scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F6CA3] mb-4">
            {"Pôle Solution : L'Intelligence Connectée"}
          </h2>
          <p className="text-[#335FA1] max-w-2xl mx-auto text-base md:text-lg">
            Vous avez un défi technologique ? Nos ingénieurs vous accompagnent dans le développement de vos solutions IoT et de supervision.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-[auto_auto] gap-4">
          {/* Card 1: Systèmes Embarqués & IoT - Left column, spans 2 rows */}
          <ReconversionCard
            title="Systèmes Embarqués & IoT"
            description="Conception de systèmes intelligents : Edge AI, temps réel et communication industrielle. Nous connectons vos actifs pour un pilotage précis."
            imageUrl="/images/iot-framer.webp"
            showHover={false}
          />

          {/* Card 2: Supervision & Data - Middle top */}
          <FormationCard
            title="Supervision & Data"
            description="Visualisez vos données en temps réel. Nos solutions de supervision transforment la donnée brute en leviers de décision."
            imageUrl="/images/data-framer.webp"
            showHover={false}
          />

          {/* Card 3: 100% Custom - Right top */}
          <FormationCard
            title="100% Custom"
            description="Développement spécifique selon vos besoins métier."
            imageUrl="/images/custom-framer.webp"
            showHover={false}
          />

          {/* Card 4: Info card - Spans middle and right columns at bottom */}
          <CertificationCard
            title="Nos experts analysent vos besoins"
            description="pour déployer des solutions sur mesure,"
            highlightedText="performantes et sécurisées."
            suffixText="Bénéficiez d'un diagnostic technique complet."
            buttonText="Lancer votre projet"
            buttonVariant="projet"
          />
        </div>
      </div>
    </section>
  )
}
