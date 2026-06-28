"use client"

import { useMemo, useState } from "react"
import { ProgramCard } from "@/components/website/cards/program-card"
import { createPackDetailModuleScrollResolver } from "./pack-detail-scroll-resolver"
import { ReservationRequestModal } from "./reservation-request-modal"
import type { ReconversionHorsPackModuleCard, ReconversionPackDTO } from "@/lib/types/reconversion"

export interface MiniPacksTabsProps {
  sectionTitle: string
  sectionSubtitle: string
  miniPacks: ReconversionPackDTO[]
  packDetailModules: ReconversionHorsPackModuleCard[]
  trackName: string
}

/** Onglets « mini packs » + carrousel + carte + modal (contenu principal, sans `<section>` extérieure). */
export function MiniPacksTabs({
  sectionTitle,
  sectionSubtitle,
  miniPacks,
  packDetailModules,
  trackName,
}: MiniPacksTabsProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [requestKind, setRequestKind] = useState<"reservation" | "catalogue">("reservation")

  const handlePrev = () => {
    setActiveTab((prev) => (prev === 0 ? miniPacks.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveTab((prev) => (prev === miniPacks.length - 1 ? 0 : prev + 1))
  }

  const resolveModuleDetailId = useMemo(
    () => createPackDetailModuleScrollResolver(packDetailModules),
    [packDetailModules],
  )

  if (miniPacks.length === 0) {
    return null
  }

  const currentPack = miniPacks[activeTab]!

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-balance break-words text-2xl font-bold text-[#176591] sm:text-3xl md:text-4xl lg:text-5xl">
          {sectionTitle}
        </h2>
        {sectionSubtitle ? (
          <p className="mx-auto mb-8 max-w-4xl text-balance break-words text-base text-[#176591] md:text-lg lg:text-xl">
            {sectionSubtitle}
          </p>
        ) : null}

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
            {miniPacks.map((pack, index) => (
              <button
                key={pack.variantSlug}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`relative z-10 mx-1 my-1 flex min-w-0 flex-1 items-center justify-center rounded-2xl px-2 text-center text-sm font-semibold break-words transition-all duration-300 md:text-base ${
                  activeTab === index ? "bg-white text-[#1e3a5f]" : "text-white hover:text-white/90"
                }`}
              >
                {pack.tabLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative min-w-0 px-0 md:px-10">
        <button
          type="button"
          onClick={handlePrev}
          className="absolute -left-2 top-1/2 z-20 hidden h-12 w-12 flex-shrink-0 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg transition-colors hover:bg-[#2563eb] md:-left-6 md:flex"
          style={{
            background: " rgba(42, 115, 164, 0.8) ",
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
          className="absolute -right-2 top-1/2 z-20 hidden h-12 w-12 flex-shrink-0 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg transition-colors hover:bg-[#2563eb] md:-right-6 md:flex"
          style={{
            background: " rgba(42, 115, 164, 0.8) ",
          }}
          aria-label="Suivant"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="px-4 md:px-0">
          <ProgramCard
            styleKey={currentPack.styleKey}
            badgeLabel={currentPack.badgeLabel}
            title={currentPack.cardTitle}
            modules={currentPack.modules}
            imageUrl={currentPack.imageUrl}
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
      </div>

      <ReservationRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        requestKind={requestKind}
        trackName={trackName}
        formationTitle={currentPack.cardTitle}
        packType="mini"
        packTag={currentPack.badgeLabel}
      />
    </div>
  )
}
