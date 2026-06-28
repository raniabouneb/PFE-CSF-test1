"use client"

import { useMemo, useState } from "react"
import { ProgramCard } from "@/components/website/cards/program-card"
import { createPackDetailModuleScrollResolver } from "./pack-detail-scroll-resolver"
import { ReservationRequestModal } from "./reservation-request-modal"
import type { ReconversionHorsPackModuleCard, ReconversionPackDTO } from "@/lib/types/reconversion"

export interface FullPacksTabsProps {
  fullPacks: ReconversionPackDTO[]
  packDetailModules: ReconversionHorsPackModuleCard[]
  trackName: string
}

/** Onglets cursus « full » + carrousel + carte programme + modal (sans enveloppe `<section>`). */
export function FullPacksTabs({ fullPacks, packDetailModules, trackName }: FullPacksTabsProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [requestKind, setRequestKind] = useState<"reservation" | "catalogue">("reservation")

  const handlePrev = () => {
    setActiveTab((prev) => (prev === 0 ? fullPacks.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveTab((prev) => (prev === fullPacks.length - 1 ? 0 : prev + 1))
  }

  const resolveModuleDetailId = useMemo(
    () => createPackDetailModuleScrollResolver(packDetailModules),
    [packDetailModules],
  )

  if (fullPacks.length === 0) {
    return null
  }

  const currentCursus = fullPacks[activeTab]!

  return (
    <>
      <div className="flex justify-center mb-12">
        <div className="relative w-full max-w-md h-16 overflow-hidden rounded-3xl p-1 flex items-stretch">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(16, 45, 104, 0.85) 40%,  rgb(9, 42, 91) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 120% 120% at 20% 15%, rgba(35, 171, 171, 0.35) 0%, transparent 65%)",
            }}
          />
          {fullPacks.map((cursus, index) => (
            <button
              key={cursus.variantSlug}
              type="button"
              onClick={() => setActiveTab(index)}
              className={`relative z-10 mx-1 my-1 flex min-w-0 flex-1 items-center justify-center rounded-2xl px-2 text-center text-sm font-semibold break-words transition-all duration-300 md:text-base ${
                activeTab === index ? "bg-white text-[#1e3a5f]" : "text-white hover:text-white/90"
              }`}
            >
              {cursus.tabLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-12 min-w-0 px-0 md:px-10">
        <button
          type="button"
          onClick={handlePrev}
          className="absolute -left-2 top-1/2 z-20 hidden h-12 w-12 flex-shrink-0 -translate-y-1/2 items-center justify-center rounded-full bg-[#0A566E]/90 text-white shadow-lg transition-colors hover:bg-[#2563eb] md:-left-6 md:flex"
          aria-label="Précédent"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute -right-2 top-1/2 z-20 hidden h-12 w-12 flex-shrink-0 -translate-y-1/2 items-center justify-center rounded-full bg-[#0A566E]/90 text-white shadow-lg transition-colors hover:bg-[#2563eb] md:-right-6 md:flex"
          aria-label="Suivant"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <ProgramCard
          styleKey={currentCursus.styleKey}
          badgeLabel={currentCursus.badgeLabel}
          title={currentCursus.cardTitle}
          modules={currentCursus.modules}
          imageUrl={currentCursus.imageUrl}
          resolveModuleDetailId={resolveModuleDetailId}
          primaryButtonLabel="Réserver une place"
          secondaryButtonLabel="Demander le catalogue"
          onPrimaryClick={() => {
            setRequestKind("reservation")
            setModalOpen(true)
          }}
          onSecondaryClick={() => {
            setRequestKind("catalogue")
            setModalOpen(true)
          }}
        />
      </div>

      <ReservationRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        requestKind={requestKind}
        trackName={trackName}
        formationTitle={currentCursus.cardTitle}
        packType="full"
        packTag={currentCursus.badgeLabel}
      />
    </>
  )
}
