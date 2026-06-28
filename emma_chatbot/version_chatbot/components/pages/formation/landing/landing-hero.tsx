"use client"

import Image from "next/image"
import { Search } from "lucide-react"

export function LandingHero() {
  return (
    <section className="py-12 md:py-16 lg:py-10 px-4 md:px-4 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-semibold text-[#1F6CA3] mb-2 leading-tight text-balance [font-family:var(--font-crimson)]">
              Pôle Formation :
            </h1>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-semibold text-[#1F6CA3] mb-2 leading-tight text-balance [font-family:var(--font-crimson)]">
              Apprendre, Certifier, Évoluer
            </h2>
            <p className="text-[#335FA1] mb-8 max-w-xl text-base md:text-lg leading-relaxed">
              Accélérez votre carrière grâce à nos parcours certifiants et notre orientation pilotée par l'IA.
            </p>
            <div className="mb-2 max-w-[600px]">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Rechercher une formation..."
                  className="w-full h-[70px] pl-8 rounded-full border border-[#5CB0D6]/50 bg-[#5CB0D6]/10 px-4 py-3 pr-12 text-sm md:text-base text-[#335FA1] placeholder:text-[#335FA1]/55   focus:outline-none focus:ring-2 focus:ring-[#5CB0D6]/35"
                />
                <Search className="pointer-events-none absolute right-8 top-1/2 h-6 w-6 -translate-y-1/2 text-[#335FA1]/50" />
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="relative h-70 w-90 md:h-80 md:w-100 overflow-hidden rounded-3xl">
              <Image
                src="/images/hero-formation.png"
                alt="Formation pratique"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

