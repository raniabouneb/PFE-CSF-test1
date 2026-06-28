"use client"

import { useRef, useState } from "react"
import { ModuleCard } from "@/components/website/cards/module-card"
import { ReservationRequestModal } from "./shell/reservation-request-modal"
import type { ReconversionHorsPackModuleCard } from "@/lib/types/reconversion"

interface ReconversionPackDetailModulesSectionProps {
  title: string
  subtitle: string
  modules: ReconversionHorsPackModuleCard[]
  trackName: string
}

/**
 * Affiche les modules `reconversion_pack` du parcours **full** Gold (données chargées via l’API page-data).
 */
export function ReconversionPackDetailModulesSection({
  title,
  subtitle,
  modules,
  trackName,
}: ReconversionPackDetailModulesSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [requestKind, setRequestKind] = useState<"reservation" | "catalogue">("reservation")
  const [selectedModuleTitle, setSelectedModuleTitle] = useState("")

  const handleRequestClick = (kind: "reservation" | "catalogue", moduleTitle: string) => {
    setRequestKind(kind)
    setSelectedModuleTitle(moduleTitle)
    setModalOpen(true)
  }

  if (modules.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      data-reconversion-pack-detail-modules
      className="bg-[#F8FAFC] px-4 py-10 md:px-8 md:py-20 lg:px-16"
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
            <div
              key={module.id}
              id={`reconversion-pack-detail-mod-${module.id}`}
              className="scroll-mt-24 md:scroll-mt-28"
            >
            <ModuleCard
              dataModuleSource="reconversion-pack"
              imageUrl={module.imageUrl}
              title={module.title}
              description={module.description}
              duration={module.duration}
              practice={module.practice}
              project={module.project}
              evaluation={module.evaluation}
              hoverDetail={module.hoverDetail}
              certified={module.certified ?? true}
              onReservationClick={() => handleRequestClick("reservation", module.title)}
              onCatalogClick={() => handleRequestClick("catalogue", module.title)}
            />
            </div>
          ))}
        </div>
      </div>
      <ReservationRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        requestKind={requestKind}
        category="reconversion"
        trackName={trackName}
        formationTitle={selectedModuleTitle}
      />
    </section>
  )
}
