"use client"

import { MiniPacksTabs } from "./shell/mini-packs-tabs"
import type { ReconversionHorsPackModuleCard, ReconversionPackDTO } from "@/lib/types/reconversion"

export interface MiniPacksSectionProps {
  sectionTitle: string
  sectionSubtitle: string
  miniPacks: ReconversionPackDTO[]
  packDetailModules: ReconversionHorsPackModuleCard[]
  trackName: string
}

/** Section « mini packs » : enveloppe + contenu dans `shell/mini-packs-tabs`. */
export function MiniPacksSection(props: MiniPacksSectionProps) {
  if (props.miniPacks.length === 0) {
    return null
  }

  return (
    <section className="bg-white px-4 py-10 md:px-8 md:py-20 lg:px-16">
      <MiniPacksTabs {...props} />
    </section>
  )
}
