"use client"

import { NavbarTransparent} from "@/components/layout/navbar-transparent"
import { PonctuellesHero } from "@/components/pages/formations-ponctuelles/ponctuelles-hero"
import { ModuleCard } from "@/components/shared/cards/module-card"
import { embeddedTrainingModules } from "@/lib/data/embedded-training-modules"

export function FormationsPonctuellesPage() {
  const handleCatalogClick = () => {
    console.log("Demander le catalogue")
  }

  return (
    <main className="min-h-screen bg-white">
      <NavbarTransparent />
      <PonctuellesHero />

      <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#335FA1] mb-4">Modules Spécialisés</h2>
            <p className="text-[#335FA1] max-w-2xl mx-auto text-base md:text-lg">
              Sélectionnez les modules qui correspondent à vos besoins de développement. Chaque formation
              offre une approche pratique et intensive.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:gap-6  max-w-6xl mx-auto">
            {embeddedTrainingModules.map((module) => (
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
    </main>
  )
}
