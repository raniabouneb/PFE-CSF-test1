import { Navbar } from "@/components/layout/website/navbar"
import { Footer } from "@/components/layout/website/footer"
import { PartenairesSectionWithData } from "@/components/sections/website/accueil/sections/partenaires-section-with-data"
import { ReconversionHeroSection } from "./sections/reconversion-hero-section"
import { FormationStats } from "./sections/shell/formation-stats"
import { FullPacksSection } from "./sections/full-packs-section"
import { MiniPacksSection } from "./sections/mini-packs-section"
import { ModulesHorsPackSection } from "./sections/modules-hors-pack-section"
import { ReconversionPackDetailModulesSection } from "./sections/pack-detail-modules-section"
import { RECONVERSION_PAGE_COPY } from "@/lib/constants/reconversion-page-copy"
import type { ReconversionTopicPageData } from "@/lib/types/reconversion"

interface ReconversionTopicPageProps {
  data: ReconversionTopicPageData
}

export function ReconversionTopicPage({ data }: ReconversionTopicPageProps) {
  const { heroCta, heroEnrolled, fullSection, miniSection, packDetailSection, horsPackSection } =
    RECONVERSION_PAGE_COPY
  const packDetailModules = data.packDetailModules ?? []

  return (
    <main className="min-h-screen bg-white">
      <Navbar variant="hero" />
      <ReconversionHeroSection
        title={data.hero.title}
        subtitle={data.hero.subtitle}
        backgroundImageUrl={data.hero.backgroundImageUrl ?? undefined}
        buttonText={heroCta}
        enrolledCount={heroEnrolled}
      />

      {data.stats.length > 0 ? (
        <div className="relative -mt-12 px-4 pb-10 md:-mt-16 md:px-8 md:pb-20 lg:-mt-20 lg:px-16">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <FormationStats stats={data.stats} />
          </div>
        </div>
      ) : null}

      <FullPacksSection
        sectionTitle={fullSection.title}
        sectionSubtitle={fullSection.subtitle}
        fullPacks={data.fullPacks}
        packDetailModules={packDetailModules}
        trackName={data.hero.title}
      />
      <MiniPacksSection
        sectionTitle={miniSection.title}
        sectionSubtitle={miniSection.subtitle}
        miniPacks={data.miniPacks}
        packDetailModules={packDetailModules}
        trackName={data.hero.title}
      />

      <ReconversionPackDetailModulesSection
        title={packDetailSection.title}
        subtitle={packDetailSection.subtitle}
        modules={packDetailModules}
        trackName={data.hero.title}
      />

      {data.horsPackModules.length > 0 ? (
        <ModulesHorsPackSection
          title={horsPackSection.title}
          subtitle={horsPackSection.subtitle}
          modules={data.horsPackModules}
        />
      ) : null}

      <PartenairesSectionWithData />
      <Footer />
    </main>
  )
}
