import { CollaborationsMarquee } from "./collaborations-marquee"
import { getHomePartnersData } from "@/lib/server/home-partners"

export async function ActualitesSection() {
  const { collaborations } = await getHomePartnersData()

  return (
    <section id="actualites" className="py-20 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        {/* Titre et sous-titre */}
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F6CA3] mb-4">
          Nos Actualités
          </h2>
          <p className="text-[#335FA1] max-w-2xl mx-auto text-base md:text-lg">
          Découvrez les témoignages et projets de collaboration qui illustrent notre impact
          </p>
        </div>

        {/* Chaîne de cartes des collaborations */}
        <div className="mt-12">
          <CollaborationsMarquee collaborations={collaborations} />
        </div>
      </div>
    </section>
  )
}
