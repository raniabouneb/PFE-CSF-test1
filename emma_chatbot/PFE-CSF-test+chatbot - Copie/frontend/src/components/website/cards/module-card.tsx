"use client"

import Image from "next/image"
import { ArrowRight, Award } from "lucide-react"
import { normalizeImageSrc } from "@/lib/image-src"

/** Hauteur fixe : image + texte (normal) ; survol = titre + jusqu’à 3 cadres + boutons côte à côte. */
const CARD_HEIGHT_PX = 430

function isFilled(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

const HOVER_STAT_FIELDS = [
  { label: "Durée", key: "duration" as const },
  { label: "Pratique", key: "practice" as const },
  { label: "Evaluation", key: "evaluation" as const },
]

export type ModuleCardDataSource = "reconversion-pack" | "ponctuelle"

interface ModuleCardProps {
  dataModuleSource?: ModuleCardDataSource
  domId?: string
  imageUrl: string
  title: string
  description: string
  duration?: string | null
  practice?: string | null
  project?: string | null
  evaluation?: string | null
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
  hoverDetail,
  certified = true,
  onReservationClick,
  onCatalogClick,
}: ModuleCardProps) {
  const imgSrc = normalizeImageSrc(imageUrl)

  const fieldValues = { duration, practice, evaluation }

  const hoverRows = HOVER_STAT_FIELDS.filter((row) => isFilled(fieldValues[row.key])).map(
    (row) => ({
      label: row.label,
      value: fieldValues[row.key]!.trim(),
    }),
  )

  return (
    <div
      id={domId}
      className="group relative w-full scroll-mt-28"
      {...(dataModuleSource ? { "data-module-source": dataModuleSource } : {})}
    >
      <article
        className="relative w-full overflow-hidden rounded-[24px] border border-[#335FA1]/30 bg-white shadow-[0_10px_40px_-14px_rgba(31,108,163,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-[#335FA1]/50 hover:shadow-[0_22px_55px_-18px_rgba(31,108,163,0.5)]"
        style={{ height: CARD_HEIGHT_PX }}
      >
        {/* État normal */}
        <div className="absolute mt-2 mb-2 ml-2 mr-2 inset-0 z-0 flex min-h-0 flex-col p-3 transition-opacity duration-300 group-hover:pointer-events-none group-hover:opacity-0">
          <div className="relative mb-3 h-[200px] w-full shrink-0 overflow-hidden rounded-[18px]">
            <Image
              src={imgSrc}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 33vw"
            />
          </div>

          <h3 className="mb-2 shrink-0 line-clamp-2 text-[15px] font-bold leading-snug text-[#335FA1] md:text-base">
            {title}
          </h3>

          <p className="mb-2 min-h-0 flex-1 overflow-y-auto text-sm leading-relaxed text-gray-600">
            {description}
          </p>

          {certified ? (
            <div className="mt-auto shrink-0 flex items-center gap-1.5 text-[#3842B0]">
              <Award className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-xs font-medium">Certifiée</span>
            </div>
          ) : null}
        </div>

        {/* Fond survol */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        >
          <Image src={imgSrc} alt="" fill className="scale-105 object-cover blur-lg" sizes="400px" />
          <div className="absolute inset-0 bg-[#2d4a5c]/88 backdrop-blur-[3px]" />
        </div>

        {/* Panneau survol */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-4 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 md:p-5">
          <h3 className="mb-3 line-clamp-2 shrink-0 text-left text-[15px] font-bold leading-snug text-white md:text-base">
            {title}
          </h3>

          <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5 py-1">
            {hoverRows.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-white/40 bg-white/10 px-3 py-3 text-center backdrop-blur-md"
              >
                <p className="text-sm font-semibold leading-tight text-white">{row.label}</p>
                <p className="mt-1 text-sm leading-snug text-white/90 line-clamp-2">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex shrink-0 flex-row items-stretch gap-2">
            {onReservationClick ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onReservationClick()
                }}
                className="flex min-w-0 flex-1 items-center justify-between gap-1.5 rounded-full bg-white px-2.5 py-2.5 text-[10px] font-medium leading-tight text-[#335FA1] shadow-sm transition-colors hover:bg-gray-50 sm:px-3 sm:text-[11px]"
              >
                <span className="truncate text-left">Réserver une place</span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#335FA1]">
                  <ArrowRight className="h-3 w-3 text-white" />
                </span>
              </button>
            ) : null}

            {onCatalogClick ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onCatalogClick()
                }}
                className="flex min-w-0 flex-1 items-center justify-between gap-1.5 rounded-full bg-white px-2.5 py-2.5 text-[10px] font-medium leading-tight text-[#335FA1] shadow-sm transition-colors hover:bg-gray-50 sm:px-3 sm:text-[11px]"
              >
                <span className="truncate text-left">Demander le catalogue</span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#335FA1]">
                  <ArrowRight className="h-3 w-3 text-white" />
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  )
}

/** Grille modules site public : 3 cartes par ligne à partir du breakpoint large. */
export const MODULE_CARDS_GRID_CLASS =
  "mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
