import { ReconversionCard } from "@/components/shared/cards/reconversion-card"
import { FormationCard } from "@/components/shared/cards/formation-card"
import { CertificationCard } from "@/components/shared/cards/certification-card"
import Link from "next/link"
import { formationPageUrl } from "@/lib/formation-routes"

export function PoleFormationSection() {
  return (
    <section id="formation" className="py-16 px-4 md:px-8 lg:px-16 bg-white scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F6CA3] mb-4">
            Pôle Formation : Expertise & Transmission
          </h2>
          <p className="text-[#335FA1] max-w-2xl mx-auto text-base md:text-lg">
            Renforcez vos compétences techniques avec des experts reconnus pour
            maîtriser les technologies de demain.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-[auto_auto] gap-4">
          {/* Card 1: Reconversion Métier - Left column, spans 2 rows */}
          <Link href={formationPageUrl("reconversion")} className="block md:row-span-2 h-full">
            <ReconversionCard
              title="Reconversion Métier"
              description="Boostez votre transition : utilisez notre agent IA d'analyse de CV pour découvrir le parcours de reconversion le plus adapté à votre profil."
              imageUrl="/images/reconversion-framer.jpg"
              showHover={true}
            />
          </Link>

          {/* Card 2: Formation à la Carte - même page Formation (développée ensemble) */}
          <Link href={formationPageUrl("ponctuelle")} className="block h-full">
            <FormationCard
              title="Formation à la Carte"
              description="Maîtrisez une compétence précise et montez en expertise à votre rythme."
              imageUrl="/images/ponctuelle-framer.jpg"
              showHover={true}
            />
          </Link>

          {/* Card 3: Parcours Sur-Mesure - Right top */}
          <Link href={formationPageUrl("parcours")} className="block h-full">
            <FormationCard
              title="Parcours Sur-Mesure"
              description="Un programme 100% personnalisé selon vos objectifs et votre emploi du temps."
              imageUrl="/images/mesure-framer.jpg"
              showHover={true}
            />
          </Link>

          {/* Card 4: Le saviez-vous? - même destination /formation */}
          <CertificationCard
            href="/formation"
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
