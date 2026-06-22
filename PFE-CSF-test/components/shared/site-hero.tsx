import Image from "next/image"

export function SiteHero() {
  return (
    <section id="accueil" className="relative w-full bg-white overflow-visible pb-32 scroll-mt-24">
      <div className="container mx-auto px-4 lg:px-8 pt-8 pb-0">
        {/* Title - Artigo (Conseil, Solution, Formation) */}
        <div className="text-center mb-4">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-semibold"
            style={{ fontFamily: "'Artigo', serif" }}
          >
            {/* Conseil - tout en italique */}
            <span className="italic text-[#33A182]">C</span>
            <span className="italic text-[#1F6CA3]">onseil</span>
            {/* Point vert */}
            <span className="text-[#33A182] mx-2">.</span>
            {/* Solution - tout en italique */}
            <span className="italic text-[#33A182]">S</span>
            <span className="italic text-[#1F6CA3]">olution</span>
            {/* Point vert */}
            <span className="text-[#33A182] mx-2">.</span>
            {/* Formation - tout en italique */}
            <span className="italic text-[#33A182]">F</span>
            <span className="italic text-[#1F6CA3]">ormation</span>
          </h1>
        </div>

        {/* Subtitle - couleur #335FA1 */}
        <div className="text-center max-w-4xl mx-auto mb-6">
          <p className="text-[#335FA1] text-base md:text-lg leading-relaxed">
            Conseil stratégique, solution sur mesure et formation d{"'"}experts :
          </p>
          <p className="text-[#335FA1] text-base md:text-lg leading-relaxed">
            CSF réunit trois pôles d{"'"}excellence pour une prise en charge intégrale de vos défis technologiques.
          </p>
        </div>
      </div>

      {/* Container for image and gradient band */}
      <div className="relative">
        {/* Gradient band - positioned behind, moved down with -bottom-8 */}
        <div
          className="absolute -bottom-25 left-0 right-0 h-60"
          style={{
            background: 'linear-gradient(to bottom, rgba(200, 220, 240, 0.4) 0%, rgba(160, 195, 225, 0.8) 40%, rgba(140, 180, 210, 1) 100%)',
          }}
        >
          {/* Radial green overlay - #32C944 at 23% opacity */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(50, 201, 68, 0.23) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Image centered - overlapping the band */}
        {/* AJUSTER ICI: width et height en pixels */}
        <div className="relative z-10 flex justify-center px-4 pb-12 ">
          <Image
            src="/images/image-hero-accueil.png"
            alt="Solution Strategy Teamwork - CSF Services"
            width={1100}
            height={450}
            style={{ width: '1100px', height: '450px', objectFit: 'cover', }}
            priority
          />
        </div>
      </div>
    </section>
  )
}
