"use client"

import { Navbar } from "@/components/layout/website/navbar"
import { ConseilHero } from "./sections/conseil-hero"
import { ConseilContactForm } from "./sections/conseil-contact-form"
import { ConseilAboutSection } from "./sections/conseil-about-section"

/** Partie client uniquement ; Partenaires + Footer restent rendus côté serveur dans `app/conseil/page.tsx`. */
export function ConseilPageClient() {
  return (
    <>
      <div>
        <Navbar variant="hero" />
        <ConseilHero />
      </div>

      <ConseilAboutSection />

      <section
        id="conseil-form"
        className="relative scroll-mt-24 px-4 pb-24 pt-16 sm:px-6 lg:px-10"
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
          <ConseilContactForm />
        </div>
      </section>
    </>
  )
}
