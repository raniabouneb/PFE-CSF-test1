import { ReconversionCard } from "@/components/website/cards/reconversion-card"
import { FormationCard } from "@/components/website/cards/formation-card"
import { CertificationCard } from "@/components/website/cards/certification-card"
import { formationPageUrl } from "@/lib/formation-routes"

export function PoleFormationSection() {
  return (
    <section
      id="formation"
      className="scroll-mt-24 bg-white px-4 py-10 md:px-8 md:py-20 lg:px-16"
      data-nav-bg="#ffffff"
      data-nav-tone="light"
    >
      <div className="mx-auto max-w-7xl min-w-0">
        <div className="text-center mb-12">
          <h2 className="mt-10 mb-4 text-balance break-words text-2xl font-bold text-[#0D2A61] sm:mt-14 sm:text-3xl md:text-4xl lg:text-5xl">
            Pôle Formation : Expertise & Transmission
          </h2>
          <p className="mx-auto mb-12 max-w-6xl text-balance break-words text-base text-[#0A285E] md:mb-20 md:text-xl lg:text-2xl">
            Renforcez vos compétences techniques avec des experts reconnus pour maîtriser les technologies de demain.
          </p>
        </div>

        <div className="mb-10 grid min-w-0 grid-cols-1 grid-rows-[auto_auto] gap-4 md:grid-cols-3">
          <div className="h-full min-h-0 min-w-0 md:row-span-2">
            <ReconversionCard
              title="Reconversion Métier"
              description="Boostez votre transition : utilisez notre agent IA d'analyse de CV pour découvrir le parcours de reconversion le plus adapté à votre profil."
              imageUrl="/images/reconversion-framer.jpg"
              showHover={true}
              href={formationPageUrl("reconversion")}
            />
          </div>

          <FormationCard
            title="Formation à la Carte"
            description="Maîtrisez une compétence précise et montez en expertise à votre rythme."
            imageUrl="/images/ponctuelle-framer.jpg"
            showHover={true}
            href={formationPageUrl("ponctuelle")}
          />

          <FormationCard
            title="Parcours Sur-Mesure"
            description="Un programme 100% personnalisé selon vos objectifs et votre emploi du temps."
            imageUrl="/images/mesure-framer.jpg"
            showHover={true}
            href={formationPageUrl("parcours")}
          />

          <CertificationCard
            href="/certifications"
            title="Le saviez-vous ?"
            description="Vous pouvez passer nos tests de"
            highlightedText="certification directement en ligne"
            buttonText="Plus de détails"
          />
        </div>
      </div>
    </section>
  )
}