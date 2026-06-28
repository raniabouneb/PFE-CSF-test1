import { CollaborationsMarquee } from "@/components/website/sections/collaborations-marquee"
import type { Collaboration } from "@/lib/data/partners"

type Props = {
  collaborations: Collaboration[]
}

/** Données fournies par le parent (fetch serveur via getHomePartnersData → FastAPI). */
export function CollaborationsSection({ collaborations }: Props) {
  return (
    <section
      id="actualites"
      className="scroll-mt-24 bg-white px-4 py-10 sm:px-6 md:py-20 lg:px-8"
      data-nav-bg="#ffffff"
      data-nav-tone="light"
    >
      <div className="mx-auto mb-12 min-w-0 max-w-7xl md:mb-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance break-words text-2xl font-bold text-[#0D2A61] sm:text-3xl md:text-4xl lg:text-5xl">
            Nos Actualités
          </h2>
          <p className="mx-auto max-w-3xl text-balance break-words text-base text-[#0A285E] md:text-xl lg:text-2xl">
            Découvrez les projets de collaboration qui illustrent notre impact
          </p>
        </div>

        <div className="mt-12">
          <CollaborationsMarquee collaborations={collaborations} />
        </div>
      </div>
    </section>
  )
}
