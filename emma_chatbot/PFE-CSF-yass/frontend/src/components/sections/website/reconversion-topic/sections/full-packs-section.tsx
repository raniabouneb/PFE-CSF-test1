"use client"

import { FullPacksTabs } from "./shell/full-packs-tabs"
import type { ReconversionHorsPackModuleCard, ReconversionPackDTO } from "@/lib/types/reconversion"

export interface FullPacksSectionProps {
  sectionTitle: string
  sectionSubtitle: string
  fullPacks: ReconversionPackDTO[]
  packDetailModules: ReconversionHorsPackModuleCard[]
  trackName: string
}

/** Section « packs complets » : titres + onglets / carrousel (logique dans `shell/full-packs-tabs`). */
export function FullPacksSection({
  sectionTitle,
  sectionSubtitle,
  fullPacks,
  packDetailModules,
  trackName,
}: FullPacksSectionProps) {
  if (fullPacks.length === 0) {
    return null
  }

  return (
    <section className="bg-white px-4 py-10 md:px-8 md:py-20 lg:px-16">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 px-2 text-balance break-words text-2xl font-bold text-[#176591] sm:text-3xl md:px-0 md:text-4xl lg:text-5xl">
            {sectionTitle}
          </h2>
          {sectionSubtitle ? (
            <p className="mx-auto max-w-4xl text-balance break-words text-base text-[#176591] md:text-lg lg:text-xl">
              {sectionSubtitle}
            </p>
          ) : null}
        </div>

        <FullPacksTabs fullPacks={fullPacks} packDetailModules={packDetailModules} trackName={trackName} />
      </div>
    </section>
  )
}
