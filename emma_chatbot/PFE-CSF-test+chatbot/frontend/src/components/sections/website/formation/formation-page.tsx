import { Suspense } from "react"
import { Navbar } from "@/components/layout/website/navbar"
import { Footer } from "@/components/layout/website/footer"
import { TrackPageVisit } from "@/components/tracking/track-page-visit"
import { PartenairesSectionWithData } from "@/components/sections/website/accueil/sections/partenaires-section-with-data"
import { LandingHero } from "@/components/sections/website/formation/sections/landing-hero"
import { FormatsSection } from "@/components/sections/website/formation/sections/formats-section"
import { getFormationTopicCardsForFormats } from "@/lib/server/formation-topic-cards"
import { searchPonctuelleModules } from "@/lib/server/ponctuelle-modules"

export async function FormationPage() {
  const [topicCards, initialPonctuelleModules] = await Promise.all([
    getFormationTopicCardsForFormats(),
    searchPonctuelleModules(""),
  ])

  return (
    <main className="min-h-screen bg-white">
      <TrackPageVisit title="Formations" />
      <Navbar variant="hero" />
      <div
        data-navbar-hero
        className="min-h-[min(85svh,52rem)] rounded-b-[2rem]  pt-28 md:rounded-b-[2.75rem] md:pt-32 lg:rounded-b-[3rem] lg:pt-32"
        style={{
          background: "linear-gradient(to bottom, rgba(5, 49, 70, 0.9) 0%, rgba(7, 25, 57) 50%)",
        }}
      >
        <LandingHero />
      </div>
      <Suspense fallback={<div className="min-h-[28rem] bg-gray-50" aria-hidden />}>
        <FormatsSection
          topicCardsFromDb={topicCards ?? undefined}
          initialPonctuelleModules={initialPonctuelleModules}
        />
      </Suspense>
      <PartenairesSectionWithData />
      <Footer />
    </main>
  )
}
