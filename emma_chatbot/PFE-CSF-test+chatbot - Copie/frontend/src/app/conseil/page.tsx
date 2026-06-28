import { Footer } from "@/components/layout/website/footer"
import { PartenairesSectionWithData } from "@/components/sections/website/accueil/sections/partenaires-section-with-data"
import { ConseilPageClient } from "@/components/sections/website/conseil/conseil-page-client"

export default async function ConseilPage() {
  return (
    <main className="min-w-0 bg-white">
      <ConseilPageClient />
      <PartenairesSectionWithData />
      <Footer />
    </main>
  )
}
