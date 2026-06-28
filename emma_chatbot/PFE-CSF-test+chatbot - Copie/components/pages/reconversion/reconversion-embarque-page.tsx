import { NavbarTransparent } from "@/components/layout/navbar-transparent"
import { Footer } from "@/components/layout/footer"
import { PartenairesSection } from "@/components/shared/sections/partenaires-section"
import { TrackHero } from "@/components/pages/reconversion/track-hero"
import { FormationStats } from "@/components/pages/reconversion/formation-stats"
import { ReconversionTabs } from "@/components/pages/reconversion/reconversion-tabs"
import { MiniPacksSection } from "@/components/pages/reconversion/mini-packs-section"
import { ModulesHorsPackSection } from "@/components/pages/reconversion/modules-hors-pack-section"

const stats = [
  {
    label: "Formation",
    value: "16 modules",
  },
  {
    label: "Pratique",
    value: "70 Lab",
  },
  {
    label: "Projets",
    value: "4 Projets réels IoT",
  },
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
  {
    label: "Evaluation",
    value: "11 examens",
  },
]


/** Parcours CSF-RCP – Système embarqué (contenu détaillé reconversion) */
export function FormationReconversionEmbarquePage() {
  return (
    <main className="min-h-screen bg-white">
      <NavbarTransparent />
      <TrackHero
        title="Formation Professionnelle en Système Embarqué"
        subtitle="Formation professionnelle animée par des experts industriels pour former les futurs professionnels !"
        buttonText="Contactez-nous pour finaliser votre inscription"
        enrolledCount="+1000 déjà inscrits"
      />

      <div className="relative -mt-12 md:-mt-16 lg:-mt-20 px-4 md:px-8 lg:px-16 pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto">
          <FormationStats stats={stats} />
        </div>
      </div>

      <ReconversionTabs />
      <MiniPacksSection />
      <ModulesHorsPackSection />

      <PartenairesSection />
      <Footer />
    </main>
  )
}
