import { PartnerLogosMarquee } from "@/components/shared/partner-logos-marquee"
import { getHomePartnersData } from "@/lib/server/home-partners"

export async function PartenairesSection() {
  const { partners } = await getHomePartnersData()

  return (
    <section id="partenaires" className="scroll-mt-24">
      {/* Header */}
      <div className="bg-[#F7FCFC] pt-16 pb-12 px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#299490] mb-3">
          Ils nous font confiance
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1F6CA3] mb-4">
          Nos partenaires & collaborateurs
        </h2>
        <p className="text-[#335FA1] max-w-2xl mx-auto text-base md:text-lg">
          Des organisations de confiance qui partagent notre vision et nous accompagnent dans notre mission.
        </p>
      </div>

      {/* Marquee */}
      <PartnerLogosMarquee partners={partners} />
    </section>
  )
}
