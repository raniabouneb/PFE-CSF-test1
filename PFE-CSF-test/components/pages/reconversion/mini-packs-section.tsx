"use client"

import { useState } from "react"
import { ProgramCard } from "@/components/pages/reconversion/program-card"

export function MiniPacksSection() {
  const [activeTab, setActiveTab] = useState<"microcontroller" | "processor">("microcontroller")

  const miniPacks = {
    microcontroller: {
      title: "Microcontrôleur",
      modules: [
        { text: "Fondamentals d'électronique" },
        { text: "Programmation ARM Cortex-M" },
        { text: "Interruptions et Timers" },
        { text: "Projet : Capteur Intelligent" },
        { text: "Communication I²C & SPI" },
      ],
      imageUrl: "/images/systemes-embarques.jpg",
    },
    processor: {
      title: "Processeur",
      modules: [
        { text: "Architecture x86/ARM" },
        { text: "Pipeline et Cache" },
        { text: "Optimisation de Performance" },
        { text: "Projet : Benchmark Système" },
        { text: "Assembleur Avancé" },
      ],
      imageUrl: "/images/custom-dev.jpg",
    },
  }

  const currentPack = miniPacks[activeTab]

  const handlePrimaryClick = () => {
    console.log(`S'inscrire pour ${currentPack.title}`)
  }

  const handleSecondaryClick = () => {
    console.log(`Demander le catalogue pour ${currentPack.title}`)
  }

  const handlePrev = () => {
    setActiveTab(activeTab === "microcontroller" ? "processor" : "microcontroller")
  }

  const handleNext = () => {
    setActiveTab(activeTab === "microcontroller" ? "processor" : "microcontroller")
  }

  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#335FA1] mb-4">
            Mini Packs : Spécialisez-vous en un Temps Record
          </h2>
          <p className="text-[#335FA1] max-w-2xl mx-auto text-base md:text-lg mb-8">
            2 programmes ciblés pour maîtriser les briques technologiques essentielles de votre futur
            métier.
          </p>

          <div className="flex justify-center mb-12">
          <div className="relative w-full max-w-md h-16 overflow-hidden rounded-full p-1 flex items-stretch">
          <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(111, 151, 214, 0.85) 45%,  rgba(51,95, 161, 1) 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 120% 120% at 40% 20%, rgba(50, 201, 68, 0.18) 0%, transparent 65%)",
              }}
            />
              <button
                type="button"
                onClick={() => setActiveTab("microcontroller")}
                className={`flex-1 relative text-sm md:text-base font-semibold rounded-full transition-all duration-300 z-10 flex items-center justify-center ${
                  activeTab === "microcontroller"
                    ? "bg-white text-[#1e3a5f]"
                    : "text-white hover:text-white/90"
                }`}
              >
                Microcontrôleur
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("processor")}
                className={`flex-1 relative text-sm md:text-base font-semibold rounded-full transition-all duration-300 z-10 flex items-center justify-center ${
                  activeTab === "processor"
                    ? "bg-white text-[#1e3a5f]"
                    : "text-white hover:text-white/90"
                }`}
              >
                Processeur
              </button>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={handlePrev}
            className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-white items-center justify-center hover:bg-[#2563eb] transition-colors z-20 flex-shrink-0 hidden md:flex shadow-lg"
            style={{
              background:
                " rgba(42, 115, 164, 0.8) ",
            }}
            aria-label="Précédent"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-white items-center justify-center hover:bg-[#2563eb] transition-colors z-20 flex-shrink-0 hidden md:flex shadow-lg"
            style={{
              background:
                " rgba(42, 115, 164, 0.8) ",
            }}
            aria-label="Suivant"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="px-4 md:px-0">
            <ProgramCard
              type={activeTab === "microcontroller" ? "microcontroller" : "processor"}
              title={currentPack.title}
              modules={currentPack.modules}
              imageUrl={currentPack.imageUrl}
              primaryButtonLabel="S'inscrire"
              secondaryButtonLabel="Demander le catalogue"
              onPrimaryClick={handlePrimaryClick}
              onSecondaryClick={handleSecondaryClick}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
