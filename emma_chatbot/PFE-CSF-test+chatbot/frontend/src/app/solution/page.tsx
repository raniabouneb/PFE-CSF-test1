import { Footer } from "@/components/layout/website/footer"
import { PartenairesSectionWithData } from "@/components/sections/website/accueil/sections/partenaires-section-with-data"
import { SolutionPageClient } from "@/components/sections/website/solution/solution-page-client"

export default async function SolutionPage() {
  return (
    <main className="min-w-0 bg-white">
      <SolutionPageClient />
      <PartenairesSectionWithData />
      <Footer />
    </main>
  )
}
