import { PonctuellesCatalogPage } from "@/components/sections/website/formations-ponctuelles/sections/ponctuelles-catalog-page"
import { TrackPageVisit } from "@/components/tracking/track-page-visit"
import { Footer } from "@/components/layout/website/footer"
import { PartenairesSectionWithData } from "@/components/sections/website/accueil/sections/partenaires-section-with-data"
import { fetchPonctuelleModulesCatalog } from "@/lib/server/ponctuelle-modules"

export const dynamic = "force-dynamic"

export default async function FormationsPonctuellesIndexPage() {
  const data = await fetchPonctuelleModulesCatalog()

  return (
    <>
      <TrackPageVisit title="Formation Par Module" />
      <PonctuellesCatalogPage data={data} />
      <PartenairesSectionWithData />
      <Footer />
    </>
  )
}
