"use client"

import { useRef } from "react"
import { ModuleCard } from "@/components/website/cards/module-card"
import type { ReconversionHorsPackModuleCard } from "@/lib/types/reconversion"

interface ModulesHorsPackSectionProps {
  title: string
  subtitle: string
  modules: ReconversionHorsPackModuleCard[]
}

export function ModulesHorsPackSection({ title, subtitle, modules }: ModulesHorsPackSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)

  const handleCatalogClick = () => {
    console.log("Demander le catalogue")
  }

  return (
    <section
      ref={sectionRef}
      data-modules-section
      className="bg-white px-4 py-10 md:px-8 md:py-20 lg:px-16"
    >
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="mb-4 text-balance break-words text-2xl font-bold text-[#176591] sm:text-3xl md:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mx-auto max-w-4xl text-balance break-words text-base text-[#176591] md:text-lg lg:text-xl">
            {subtitle}
          </p>
        </div>

        <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-4 md:gap-6">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              dataModuleSource="ponctuelle"
              imageUrl={module.imageUrl}
              title={module.title}
              description={module.description}
              duration={module.duration}
              practice={module.practice}
              project={module.project}
              evaluation={module.evaluation}
              hoverDetail={module.hoverDetail}
              certified={module.certified ?? true}
              onCatalogClick={handleCatalogClick}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
