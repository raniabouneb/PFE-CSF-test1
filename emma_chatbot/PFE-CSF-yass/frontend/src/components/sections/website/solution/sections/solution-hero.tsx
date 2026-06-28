"use client"

import Image from "next/image"

const heroCards = [
  {
    id: 1,
    title: "Systèmes embarqués & IoT",
    description:
      "Conception de solutions embarquées, firmware et connectivité intelligente pour vos équipements.",
  },
  {
    id: 2,
    title: "Supervision & données",
    description:
      "Collecte, visualisation et exploitation de vos données pour un pilotage métier plus précis.",
  },
  {
    id: 3,
    title: "Développement sur mesure",
    description:
      "Applications web et plateformes personnalisées, pensées pour vos processus et contraintes réelles.",
  },
]

export function SolutionHero() {
  const handleScroll = () => {
    const el = document.getElementById("solution-form")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section data-navbar-hero className="relative isolate">
      <div
        className="relative overflow-hidden bg-white"
        style={{ paddingBottom: "180px", minHeight: "740px" }}
      >
        <div className="absolute inset-y-0 right-0 w-full sm:h-[860px] sm:w-full">
          <Image
            src="/images/iot-accueil3.webp"
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

        <div className="relative z-10 ml-12 mx-auto w-full max-w-7xl pr-6 pt-40 sm:pr-10 sm:pt-50">
          <div className="max-w-7xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#176591] sm:text-xs">
              Pôle Solution · Développement &amp; intégration
            </p>
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.08] text-white sm:text-6xl lg:text-[3.4rem]">
              Nous donnons vie à
              <br />
              <span className="text-[#176591]">vos solutions numériques</span>
            </h1>
            <p className="mb-10 max-w-2xl text-base leading-relaxed text-white/70 sm:text-xl">
              Applications métier, systèmes embarqués, IoT et supervision des données : nous concevons, intégrons et
              industrialisons vos logiciels avec la même rigueur technique du cadrage à la mise en production.
            </p>
            <button
              type="button"
              onClick={handleScroll}
              className="mb-40 inline-flex items-center gap-6 rounded-2xl bg-[#0A566E] px-16 py-5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[#0A566E]/70 hover:shadow-xl sm:text-base"
            >
              Décrivez votre projet
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 leading-[0]" style={{ height: "110px" }}>
          <svg
            viewBox="0 0 1440 110"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "110px", display: "block" }}
          >
            <path d="M0,0 Q720,110 1440,0 L1440,110 L0,110 Z" fill="white" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 -mt-[150px] bg-transparent">
        <div className="mx-auto max-w-[1400px] px-4 pb-12 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {heroCards.map((card) => (
              <div
                key={card.id}
                className="flex flex-col items-start rounded-2xl bg-white p-6 shadow-[0_6px_28px_rgba(0,0,0,0.1)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(23,101,145,0.3)] lg:p-7"
              >
                <h3 className="mb-3 whitespace-nowrap text-lg font-bold leading-snug text-[#1a3a5c] lg:text-xl">{card.title}</h3>
                <p className="text-base leading-relaxed text-gray-600 lg:text-lg">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
