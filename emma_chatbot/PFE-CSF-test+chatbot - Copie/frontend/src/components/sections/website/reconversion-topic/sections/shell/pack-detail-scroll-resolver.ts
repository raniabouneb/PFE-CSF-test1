import type { ReconversionHorsPackModuleCard } from "@/lib/types/reconversion"
import type { ProgramCardModule, ProgramCardModuleTargetResolver } from "@/components/website/cards/program-card"

/**
 * Toute ligne de `ProgramCard` (full ou mini) avec le **même libellé** qu’un module
 * de la section « modules en détails » déclenche un scroll vers
 * `#reconversion-pack-detail-mod-{id}`.
 */
export function createPackDetailModuleScrollResolver(
  packDetailModules: ReconversionHorsPackModuleCard[],
): ProgramCardModuleTargetResolver {
  return (module: ProgramCardModule) => {
    if (packDetailModules.length === 0) return null
    const t = module.text.trim()
    const match = packDetailModules.find((m) => m.title.trim() === t)
    if (!match) return null
    return `reconversion-pack-detail-mod-${match.id}`
  }
}
