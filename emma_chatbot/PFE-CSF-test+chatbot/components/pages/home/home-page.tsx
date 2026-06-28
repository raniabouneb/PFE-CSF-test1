import { Navbar } from "@/components/layout/navbar"
import { SiteHero } from "@/components/shared/site-hero"
import { PoleConseilSection } from "@/components/pages/home/pole-conseil-section"
import { PoleSolutionSection } from "@/components/pages/home/pole-solution-section"
import { PoleFormationSection } from "@/components/pages/home/pole-formation-section"
import { PartenairesSection } from "@/components/shared/sections/partenaires-section"
import { ActualitesSection } from "@/components/shared/sections/actualites-section"
import { TemoignagesSection } from "@/components/shared/sections/temoignages-section"
import { Footer } from "@/components/layout/footer"
import { HomeHashScroll } from "@/components/pages/home/home-hash-scroll"

export function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <SiteHero />
      <HomeHashScroll offsetPx={92} />

      <PoleConseilSection />
      <PoleSolutionSection />
      <PoleFormationSection />
      <ActualitesSection/>
      <PartenairesSection />
      <TemoignagesSection />
      <Footer />
    </main>
  )
}

