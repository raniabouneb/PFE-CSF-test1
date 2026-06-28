"use client"

import { useState } from "react"
import { ProgramCard } from "@/components/pages/reconversion/program-card"

interface CursusData {
  id: string
  name: string
  title: string
  modules: {
    text: string
    moduleId?: string
  }[]
  image: string
  buttons: {
    primary: string
    secondary: string
  }
}

const cursusData: CursusData[] = [
  {
    id: "optimum",
    name: "OPTIMUM",
    title: "CSF-RCP - Développement en Système Embarqué",
    modules: [
      { text: "L'essentiel du langage C pour embarqué", moduleId: "1" },
      { text: "Langage C pour les systèmes embarqués", moduleId: "1" },
      { text: "Architecture et programmation des uC STM32", moduleId: "2" },
      { text: "Projet IoT sur STM32" },
      { text: "La programmation orientée objets en C++" },
      { text: "IHM QT pour les systèmes embarqués" },
      { text: "Projet IHM sur Arduino" },
      { text: "Linux embarqué et programmation Shell", moduleId: "4" },
      { text: "« Kernelspace » et intégration des drivers", moduleId: "4" },
      { text: "Programmation sur environnement Linux", moduleId: "4" },
      { text: "Projet IoT sur Raspberry Pi", moduleId: "4" },
      { text: "Stage de Projet de Fin de Formation" },
    ],
    image: "/images/hero-formation.png",
    buttons: { primary: "S'inscrire", secondary: "Demander le catalogue" },
  },
  {
    id: "silver",
    name: "SILVER",
    title: "RTOS & Protocoles - Systèmes Temps Réel",
    modules: [
      { text: "RTOS FreeRTOS et µC/OS-III", moduleId: "3" },
      { text: "Synchronisation et communication inter-tâches", moduleId: "3" },
      { text: "Protocoles CAN, Modbus et MQTT" },
      { text: "Gestion de la mémoire en temps réel", moduleId: "2" },
      { text: "Debugging et optimisation performante" },
      { text: "Projet : Système multi-tâches temps réel", moduleId: "3" },
      { text: "Stage projet avancé" },
    ],
    image: "/images/supervision-data.jpg",
    buttons: { primary: "S'inscrire", secondary: "Demander le catalogue" },
  },
  {
    id: "gold",
    name: "GOLD",
    title: "IoT Avancé & Cloud - Écosystème Connecté",
    modules: [
      { text: "Architecture IoT en couches" },
      { text: "MQTT, CoAP et protocoles légers" },
      { text: "Intégration Azure IoT Hub et AWS IoT" },
      { text: "Processing et analytics en temps réel" },
      { text: "Edge computing et IA sur microcontroleurs" },
      { text: "Sécurité et cryptographie pour IoT" },
      { text: "Projet : Plateforme IoT complète" },
      { text: "Stage projet enterprise" },
    ],
    image: "/images/custom-dev.jpg",
    buttons: { primary: "S'inscrire", secondary: "Demander le catalogue" },
  },
]

export function ReconversionTabs() {
  const [activeTab, setActiveTab] = useState(0)
  const currentCursus = cursusData[activeTab]

  const handlePrev = () => {
    setActiveTab((prev) => (prev === 0 ? cursusData.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveTab((prev) => (prev === cursusData.length - 1 ? 0 : prev + 1))
  }

  const handleModuleClick = () => {
    const modulesSection = document.querySelector("[data-modules-section]")
    modulesSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="py-16 md:py-20 px-4 md:px-8 lg:px-16 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#335FA1] mb-4">
            Parcours de Reconversion Totale : Devenez Expert
          </h2>
          <p className="text-[#Devenez Expert] max-w-2xl mx-auto text-[#335FA1] md:text-lg">
            3 cursus intensifs conçus pour transformer radicalement votre carrière et vous rendre 100%
            opérationnel.
          </p>
        </div>

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
            {cursusData.map((cursus, index) => (
              <button
                key={cursus.id}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`flex-1 relative text-sm md:text-base font-semibold rounded-full transition-all duration-300 z-10 flex items-center justify-center ${
                  activeTab === index ? "bg-white text-[#Devenez Expert]" : "text-white hover:text-white/90"
                }`}
              >
                {cursus.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-12">
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

          <ProgramCard
            type={activeTab === 0 ? "optimum" : activeTab === 1 ? "silver" : "gold"}
            title={currentCursus.title}
            modules={currentCursus.modules}
            imageUrl={currentCursus.image}
            primaryButtonLabel={currentCursus.buttons.primary}
            secondaryButtonLabel={currentCursus.buttons.secondary}
            onModuleClick={handleModuleClick}
          />
        </div>
      </div>
    </section>
  )
}
