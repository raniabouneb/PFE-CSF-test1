import { CertificationsRouteMountLogger } from "./certifications-route-mount-logger"
import { CertificationsPageContent } from "./sections/certifications-page-content"
import { Footer } from "@/components/layout/website/footer"
import { TrackPageVisit } from "@/components/tracking/track-page-visit"
import { PartenairesSectionWithData } from "@/components/sections/website/accueil/sections/partenaires-section-with-data"
import { getCertificationsPageData } from "@/lib/server/certifications-page"

/** Toujours recharger depuis l’API (données Supabase éditables). */
export const dynamic = "force-dynamic"

export default async function CertificationsRoutePage() {
  const data = await getCertificationsPageData()

  return (
    <>
      <TrackPageVisit title="Certifications" />
      <CertificationsRouteMountLogger />
      <CertificationsPageContent data={data} />
      <PartenairesSectionWithData />
      <Footer />
    </>
  )
}
