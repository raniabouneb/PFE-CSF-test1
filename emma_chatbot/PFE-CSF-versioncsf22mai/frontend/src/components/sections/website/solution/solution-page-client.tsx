"use client"

import { Navbar } from "@/components/layout/website/navbar"
import { SolutionHero } from "./sections/solution-hero"
import { SolutionAboutSplit } from "./sections/solution-about-split"
// import { SolutionAboutCards } from "./sections/solution-about-cards"
import { SolutionContactForm } from "./sections/solution-contact-form"

export function SolutionPageClient() {
  return (
    <>
      <div>
        <Navbar variant="hero" />
        <SolutionHero />
      </div>

      <section id="solution-piliers" className="relative z-20 scroll-mt-24 overflow-x-clip bg-white pb-2 pt-12 sm:pt-16">
        <SolutionAboutSplit />
        {/* <SolutionAboutCards /> */}
      </section>

      {/* Bleu foncé remonte sous les cartes : ~⅓ inférieure des cartes repose sur ce fond */}
      <section
        id="solution-form"
        className="relative z-10 scroll-mt-24 -mt-28 px-4 pb-24 pt-[10.5rem] sm:-mt-[7.75rem] sm:px-6 sm:pt-[11.25rem] md:-mt-36 md:pt-[13rem] lg:-mt-[9.5rem] lg:px-10 lg:pt-[13.5rem]"
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[url('/images/consulting.jpg')] bg-cover bg-center"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-l from-[#05424a]/80 to-[#02112b]/60"
        />
        <div aria-hidden className="absolute inset-0 bg-[#071939]/30" />

        <div className="relative z-10">
          <SolutionContactForm />
        </div>
      </section>
    </>
  )
}
