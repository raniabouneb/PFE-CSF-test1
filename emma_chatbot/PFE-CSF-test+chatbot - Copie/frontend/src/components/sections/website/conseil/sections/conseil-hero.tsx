"use client"

import Image from "next/image"

const heroCards = [
  {
    id: 1,
    title: "Stratégie & Partenariats",
    description:
      "Forgez une vision claire et des alliances solides avec les meilleurs partenaires pour des résultats durables.",
    iconUrl: "/images/partenariat1.png",
  },
  {
    id: 2,
    title: "Transformation Digitale",
    description:
      "Pilotez votre révolution numérique avec les technologies les plus performantes pour rester compétitif.",
    iconUrl: "/images/digital1.png",
  },
  {
    id: 3,
    title: "Performance Opérationnelle",
    description:
      "Optimisez chaque processus, boostez votre productivité et transformez vos ambitions en succès mesurables.",
    iconUrl: "/images/performance1.png",
  },
  {
    id: 4,
    title: "Développement du Potentiel",
    description:
      "Révélez les talents de vos équipes et propulsez chaque parcours professionnel vers de nouveaux sommets.",
    iconUrl: "/images/potentiel1.png",
  },
]

export function ConseilHero() {
  const handleScroll = () => {
    const el = document.getElementById("conseil-form")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section data-navbar-hero className="relative isolate">

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden bg-white"
        style={{ paddingBottom: "180px", minHeight: "740px" }}
      >
        {/* Background photo */}
        <div className="absolute inset-y-0 right-0 w-full sm:w-[100%] sm:h-[860px]">
          <Image
            src="/images/consulting.jpg"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 640px) 100vw, 62vw"
          />
          <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(3, 44, 63, 1) 0%, rgba(2, 17, 43, 0.8) 50%)",
          }}
        />
        </div>

        {/* Decorative blue sphere – top left 
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full sm:h-[400px] sm:w-[400px]"
          style={{
            background:
              "radial-gradient(circle at 38% 38%, #115C73 0%, #0B2752 55%, transparent 80%)",
            opacity: 0.75,
          }}
        />
*/}
        {/* Text content */}
        <div className="relative z-10 ml-12 mx-auto w-full max-w-7xl pt-40 sm:pt-50 ">
          <div className="max-w-7xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#176591] sm:text-xs">
              Conseil Stratégique &amp; Accompagnement
            </p>
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.08] text-white sm:text-6xl lg:text-[3.4rem]">
              Nous donnons vie à
              <br />
              <span className="text-[#176591]">vos grandes ambitions</span>
            </h1>
            <p className="mb-10 max-w-2xl text-base leading-relaxed text-white/70 sm:text-xl">
              Nous accompagnons entreprises et porteurs de projets avec une stratégie sur mesure,
              des partenariats solides et une expertise reconnue pour transformer vos ambitions en
              réussites concrètes.
            </p>
            <button
              onClick={handleScroll}
              className="inline-flex items-center mb-40 gap-6 rounded-2xl bg-[#0A566E] hover:bg-[#0A566E]/70 px-16 py-5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl sm:text-base"
            >
              Démarrer votre accompagnement
            </button>
          </div>
        </div>

        {/* ── Convex parabolic dome curve at the bottom ──
            The white SVG fills the bottom with a concave top edge,
            making the dark hero appear convex (dome-shaped). */}
        <div className="absolute bottom-0 left-0 right-0 leading-[0]" style={{ height: "110px" }}>
          <svg
            viewBox="0 0 1440 110"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "110px", display: "block" }}
          >
            {/* White area: concave top → makes dark hero look convex/dome */}
            <path d="M0,0 Q720,110 1440,0 L1440,110 L0,110 Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* ── 4 cards overlapping the dome ──
          Negative margin pulls them UP into the dark dome area */}
      <div className="relative z-10 -mt-[150px] bg-transparent">
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-8 lg:px-16">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {heroCards.map((card) => (
              <div
                key={card.id}
                className="flex flex-col items-start rounded-2xl bg-white p-6 shadow-[0_6px_28px_rgba(0,0,0,0.1)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(23,101,145,0.3)] lg:p-7"
              >
                <div className="relative mb-5 h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                  <Image src={card.iconUrl} alt="" fill className="object-cover" sizes="56px" />
                </div>
                <h3 className="mb-2 text-base font-bold text-[#1a3a5c] lg:text-[17px]">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  )
}
