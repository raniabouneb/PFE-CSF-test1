import { ReconversionCard } from "@/components/website/cards/reconversion-card"
import { FormationCard } from "@/components/website/cards/formation-card"
import { CertificationCard } from "@/components/website/cards/certification-card"

export function PoleSolutionSection() {
  return (
    <section
      id="solution"
      className="scroll-mt-24 bg-[#D8EAED] px-4 py-10 md:px-8 md:py-20 lg:px-16"
      data-nav-bg="#F7FCFC"
      data-nav-tone="light"
    >
      <div className="mx-auto max-w-7xl min-w-0">
        <div className="text-center mb-12">
          <h2 className="mt-10 mb-4 text-balance break-words text-2xl font-bold text-[#0D2A61] sm:mt-14 sm:text-3xl md:text-4xl lg:text-5xl">
            {"Pôle Solution : L'Intelligence Connectée"}
          </h2>
          <p className="mx-auto mb-12 max-w-3xl text-balance break-words text-base text-[#0A285E] md:mb-20 md:text-xl lg:text-2xl">
            Vous avez un défi technologique ? Nos ingénieurs vous accompagnent dans le développement de vos solutions IoT et de supervision.
          </p>
        </div>

        <div className="mb-20 grid min-w-0 grid-cols-1 grid-rows-[auto_auto] gap-4 md:grid-cols-3">
          <ReconversionCard
            title="Systèmes Embarqués & IoT"
            description="Conception de systèmes intelligents : Edge AI, temps réel et communication industrielle. Nous connectons vos actifs pour un pilotage précis."
            imageUrl="/images/iot-accueil3.webp"
            showHover={false}
          />

          <FormationCard
            title="Supervision & Données  "
            description="Visualisez vos données en temps réel. Nos solutions de supervision transforment la donnée brute en leviers de décision."
            imageUrl="/images/data-accueil.webp"
            showHover={false}
          />

          <FormationCard
            title="100% Sur Mesure"
            description="Développement spécifique selon vos besoins métier."
            imageUrl="/images/100-accueil.jpg"
            showHover={false}
          />

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