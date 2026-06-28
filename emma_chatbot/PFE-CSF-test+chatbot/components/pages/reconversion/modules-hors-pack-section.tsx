"use client"

import { useRef } from "react"
import { ModuleCard } from "@/components/shared/cards/module-card"
import { horsPackModules } from "@/lib/data/embedded-training-modules"

export function ModulesHorsPackSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  const handleCatalogClick = () => {
    console.log("Demander le catalogue")
  }

  return (
    <section
      ref={sectionRef}
      data-modules-section
      className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#335FA1] mb-4">Modules Hors Pack</h2>
          <p className="text-[#335FA1] max-w-2xl mx-auto text-base md:text-lg">
            Explorez nos modules spécialisés pour approfondir vos compétences en systèmes embarqués.
            Chaque module offre une formation pratique intensive avec projets et certifications.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:gap-6 max-w-6xl mx-auto">
          {horsPackModules.map((module) => (
            <ModuleCard
              key={module.id}
              imageUrl={module.imageUrl}
              title={module.title}
              description={module.description}
              badge={module.badge}
              duration={module.duration}
              practice={module.practice}
              project={module.project}
              evaluation={module.evaluation}
              onCatalogClick={handleCatalogClick}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
