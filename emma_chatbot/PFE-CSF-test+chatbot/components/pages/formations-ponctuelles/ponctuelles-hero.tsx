"use client"

import Image from "next/image"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PonctuellesHeroProps {
  title?: string
  subtitle?: string
  buttonText?: string
}

export function PonctuellesHero({
  title = "Expertise en Système Embarqué",
  subtitle = "Découvrez nos modules spécialisés, conçus pour une montée en compétences immédiate et ciblée.",
  buttonText = "Contactez-nous pour finaliser votre inscription",
}: PonctuellesHeroProps) {
  return (
    <section className="relative overflow-hidden" data-navbar-hero>
        <Image
          src="/images/reconversion-hero.png"
          alt="Formation background"
          fill
          className="object-cover"
          priority
        />

        <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(77, 127, 135, 0.35) 0%, rgba(12, 58, 75, 0.63) 40%, rgba(22, 61, 96, 0.92) 100%)',
          }} />

      <div className="relative px-4 md:px-8 lg:px-16 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 mt-16 ">{title}</h1>
              <p className="text-base md:text-lg mb-8 text-blue-50 max-w-xl">{subtitle}</p>

              <div className="mb-8 max-w-[600px]  ">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Rechercher un module..."
                    className="w-full h-[70px] px-4 py-3 pl-8 pr-12 rounded-full bg-white/20 text-white placeholder-blue-100 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <Search className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-white/60 pointer-events-none" />
                </div>
              </div>

              <Button
                type="button"
                onClick={() => console.log("Contact clicked")}
                className="h-18 w-full md:w-auto bg-[#3576AB] hover:bg-[#335FA1] text-white font-semibold px-6 md:px-8 rounded-lg transition-colors duration-300 mb-4 md:mb-6"
              >
                {buttonText}
              </Button>
            </div>
             {/*
            <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-xl opacity-70">
              <Image
                src="/images/hero-formations-ponctuelles.jpg"
                alt="Expertise en Système Embarqué"
                fill
                className="object-cover"
                priority
              
            </div>/>*/}
          </div>
        </div>
      </div>
    </section>
  )
}
