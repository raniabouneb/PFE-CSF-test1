import Link from "next/link"
import { Navbar } from "@/components/layout/website/navbar"
import { Footer } from "@/components/layout/website/footer"
import { PartenairesSectionWithData } from "@/components/sections/website/accueil/sections/partenaires-section-with-data"

interface FormationReconversionPlaceholderPageProps {
  title: string
  description?: string
}

export function FormationReconversionPlaceholderPage({
  title,
  description = "Le détail de ce parcours sera bientôt disponible. En attendant, découvrez notre offre Système embarqué ou contactez-nous.",
}: FormationReconversionPlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-white">
      <Navbar variant="hero" />
      <section className="px-4 md:px-8 lg:px-16 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-4">{title}</h1>
          <p className="text-[#5a6a7a]  mb-8">{description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/formation/reconversion/systeme-embarque"
              className="inline-flex justify-center rounded-full bg-[#1e4b8e] px-6 py-3 text-sm font-medium text-white hover:bg-[#163a6e]"
            >
              Voir le parcours Système embarqué
            </Link>
            <Link
              href="/formation"
              className="inline-flex justify-center rounded-full border border-[#1e4b8e] px-6 py-3 text-sm font-medium text-[#1e4b8e] hover:bg-[#1e4b8e]/5"
            >
              Retour aux formats de formation
            </Link>
          </div>
        </div>
      </section>
      <PartenairesSectionWithData />
      <Footer />
    </main>
  )
}
