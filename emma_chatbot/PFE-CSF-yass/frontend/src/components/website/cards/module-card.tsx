"use client"

import Image from "next/image"
import { ArrowRight, Award } from "lucide-react"
import { normalizeImageSrc } from "@/lib/image-src"

/**
 * Carte module (affichage identique) — les **données** viennent du parent selon le contexte :
 * - Page **reconversion** (module pack Gold) : `reconversion_pack` / `reconversion_pack_module` via l’API (`packDetailModules`),
 *   alimenté par la table `reconversion_pack_module`.
 * - Page **reconversion** (modules « hors pack ») : `ponctuelle` via l’API (`horsPackModules` depuis
 *   `ponctuelle_module` lié au slug du parcours).
 * - **Formation ponctuelle** (fiche) : `ponctuelle_formation` / `ponctuelle_module` via
 *   `PonctuelleFormationPageData` (pas d’appel ici, tout est chargé côté serveur ou route).
 *
 * Ne pas placer de `fetch` dans ce composant : l’appel d’une table ou d’une autre se fait
 * côté route/API, puis passage en props.
 */
function isFilled(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export type ModuleCardDataSource = "reconversion-pack" | "ponctuelle"

interface ModuleCardProps {
  /** D’où proviennent les données, pour sémantique / traçage (attribut `data-module-source` sur la racine). */
  dataModuleSource?: ModuleCardDataSource
  /** Ancre pour liens profonds (ex. recherche `/formation` → `#ponctuelle-module-42`). */
  domId?: string
  imageUrl: string
  title: string
  description: string
  badge?: {
    icon: string
    label: string
  }
  duration?: string | null
  practice?: string | null
  project?: string | null
  evaluation?: string | null
  /** Texte supplémentaire au survol (optionnel, ex. `hover_detail` en BD) */
  hoverDetail?: string | null
  certified?: boolean
  onReservationClick?: () => void
  onCatalogClick?: () => void
}

export function ModuleCard({
  dataModuleSource,
  domId,
  imageUrl,
  title,
  description,
  duration,
  practice,
  project,
  evaluation,
  certified = true,
  onReservationClick,
  onCatalogClick,
}: ModuleCardProps) {
  const detailColumns = [
    { label: "Durée", value: duration },
    { label: "Pratique", value: practice },
    { label: "Projet", value: project },
    { label: "Evaluation", value: evaluation },
  ].filter((col): col is { label: string; value: string } => isFilled(col.value))

  return (
    <div
      id={domId}
      className="group relative w-full cursor-pointer scroll-mt-28"
      {...(dataModuleSource ? { "data-module-source": dataModuleSource } : {})}
    >
      <div className="relative min-h-[300px] overflow-hidden rounded-4xl border border-[#335FA1] bg-white transition-all duration-300 sm:min-h-[240px]">
        <div className="absolute inset-0 z-0 flex flex-col items-stretch sm:flex-row sm:items-center">
          <div className="relative mx-2 mt-2 h-44 w-[calc(100%-1rem)] min-w-0 shrink-0 overflow-hidden rounded-3xl sm:mb-2 sm:ml-2 sm:mr-0 sm:h-[220px] sm:w-[260px] sm:max-w-[min(260px,calc(100%-2rem))]">
            <Image
              src={normalizeImageSrc(imageUrl)}
              alt={title}
              fill
              className="h-full w-full object-cover"
              sizes="(max-width: 640px) 100vw, 260px"
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center p-4 sm:min-h-[204px] md:p-5">
            <h3 className="mb-1.5 text-balance break-words text-base font-bold leading-tight text-[#335FA1] md:text-[22px]">
              {title}
            </h3>

            <p className="text-xs md:text-[17px] text-gray-600 leading-relaxed mb-3 line-clamp-2">
              {description}
            </p>

            {certified ? (
              <div className="flex items-center gap-1.5 text-[#3842B0]">
                <Award className="w-4 h-4" />
                <span className="text-xs font-medium">Certifiée</span>
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[1] rounded-4xl bg-[#5A808C]/60 opacity-0 backdrop-blur-2xl backdrop-saturate-150 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />

        {/* Même gouttière gauche/droite pour tout le contenu au survol (ne pas dépasser). */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col rounded-4xl py-4 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 md:py-5">
          <div className="mx-6 mt-2 flex min-h-0 min-w-0 flex-1 flex-col md:mt-5">
            <h3 className="mb-3 shrink-0 text-left text-lg font-bold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] break-words md:text-xl">
              {title}
            </h3>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center py-3">
              {detailColumns.length > 0 ? (
                <div className="flex min-w-0 max-w-full flex-wrap items-stretch gap-2 md:gap-3">
                  {detailColumns.map((col) => (
                    <div
                      key={col.label}
                      className={`min-w-0 flex-1 basis-0 rounded-lg border border-white/40 bg-white/10 px-3 py-2.5 text-center shadow-sm backdrop-blur-sm md:rounded-xl md:px-4 md:py-3 ${col.label === "Projet" ? "md:flex-[2]" : ""}`}
                    >
                      <p className="mb-1.5 text-sm font-semibold text-white md:text-base">{col.label}</p>
                      <p
                        className={`text-sm leading-snug text-white/85 md:text-base ${col.label === "Projet" ? "line-clamp-2 md:line-clamp-2" : "line-clamp-2"}`}
                      >
                        {col.value.trim()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div
              className={`mt-auto flex min-w-0 shrink-0 items-center gap-2 pt-1 md:pt-2 ${certified ? "justify-between" : "justify-end"}`}
            >
              {certified ? (
                <div className="flex min-w-0 items-center gap-1.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
                  <Award className="h-4 w-4 shrink-0" />
                  <span className="truncate text-sm font-medium">Certifiée</span>
                </div>
              ) : null}

              <div className="flex shrink-0 items-center gap-2">
                {onReservationClick ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onReservationClick()
                    }}
                    className="flex max-w-full shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-[#335FA1] shadow-sm transition-colors hover:bg-gray-50 md:px-5 md:py-2.5 md:text-sm"
                  >
                    <span className="truncate">Réserver une place</span>
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#335FA1] md:h-5 md:w-5">
                      <ArrowRight className="h-2.5 w-2.5 text-white md:h-3 md:w-3" />
                    </div>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCatalogClick?.()
                  }}
                  className="flex max-w-full shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-[#335FA1] shadow-sm transition-colors hover:bg-gray-50 md:px-5 md:py-2.5 md:text-sm"
                >
                  <span className="truncate">Demander le catalogue</span>
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#335FA1] md:h-5 md:w-5">
                    <ArrowRight className="h-2.5 w-2.5 text-white md:h-3 md:w-3" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
