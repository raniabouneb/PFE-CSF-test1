import { Navbar } from "@/components/layout/website/navbar"
import { AcceuilHeroSection } from "@/components/sections/website/accueil/sections/acceuil-hero-section"
import { PoleConseilSection } from "@/components/sections/website/accueil/sections/pole-conseil-section"
import { PoleSolutionSection } from "@/components/sections/website/accueil/sections/pole-solution-section"
import { PoleFormationSection } from "@/components/sections/website/accueil/sections/pole-formation-section"
import { PartenairesSectionWithData } from "@/components/sections/website/accueil/sections/partenaires-section-with-data"
import { CollaborationsSection } from "@/components/sections/website/accueil/sections/collaborations-section"
import { TemoignageSection } from "@/components/sections/website/accueil/sections/temoignage-section"
import { Footer } from "@/components/layout/website/footer"
import { getHomePartnersData } from "@/lib/server/home-partners"

/**
 * Page d’accueil : un seul appel GET /api/v1/home/partners-data (revalidate côté fetch)
 * pour Actualités + Partenaires.
 */
export async function PageAcceuil() {
  const { collaborations, heroBackgroundImage } = await getHomePartnersData()

  return (
    <main className="min-h-screen bg-white" data-nav-bg="#ffffff" data-nav-tone="light">
      <Navbar variant="hero" heroScrollMode="homeInset" />
      <AcceuilHeroSection backgroundImageUrl={heroBackgroundImage} />

      <PoleConseilSection />
      <PoleSolutionSection />
      <PoleFormationSection />
      <CollaborationsSection collaborations={collaborations} />
      <PartenairesSectionWithData />
      <Footer />
    </main>
  )
}
