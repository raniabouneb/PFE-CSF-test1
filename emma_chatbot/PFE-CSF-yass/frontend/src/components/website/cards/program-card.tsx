"use client"

import Image from "next/image"
import { useEffect, useMemo, useState, type TransitionEvent } from "react"
import { RegisterButton } from "@/components/website/buttons/register-button"
import { CatalogButton } from "@/components/website/buttons/catalog-button"
import { normalizeImageSrc } from "@/lib/image-src"

const STYLE_KEYS = ["basic", "optimum", "silver", "gold", "microcontroller", "processor"] as const
type StyleKey = (typeof STYLE_KEYS)[number]

function normalizeStyleKey(k: string): StyleKey {
  const lower = k.toLowerCase()
  if (STYLE_KEYS.includes(lower as StyleKey)) return lower as StyleKey
  return "optimum"
}

export interface ProgramCardModule {
  text: string
  kind?: "course" | "project"
}

/**
 * Résout l’`id` DOM d’une carte « modules en détails » (`reconversion-pack-detail-mod-…`) pour
 * le scroll depuis une ligne de `ProgramCard` (même libellé que le titre du module en détail).
 */
export type ProgramCardModuleTargetResolver = (
  module: ProgramCardModule,
  index: number,
) => string | null

export function scrollToElementById(
  id: string,
  opts: ScrollIntoViewOptions = { behavior: "smooth", block: "start" },
) {
  if (typeof document === "undefined") return
  const el = document.getElementById(id)
  el?.scrollIntoView(opts)
}

/** Même principe que `landing-hero.tsx` (cycle), mais appliqué aux hauteurs (colonne verticale). */
const HEIGHT_CYCLE_3: readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]] = [
  [58, 22, 20],
  [20, 58, 22],
  [22, 20, 58],
] as const

const HEIGHT_CYCLE_2: readonly [readonly [number, number], readonly [number, number], readonly [number, number]] = [
  // Cas 2 bandeaux : bandeau “petit” volontairement plus bas pour laisser respirer le grand (meilleur fit sur cartes moins hautes).
  [82, 18],
  [18, 82],
  [74, 26],
] as const

const ROTATION_MS = 2000

/**
 * Filtre bleu/teal semi-transparent (aligné sur `landing-hero.tsx`) : même “color wash” que le hero Formation.
 */
const STRIP_COLOR_WASH =
  "linear-gradient(to bottom, rgba(31, 108, 163, 0.34) 0%, rgba(43, 94, 148, 0.14) 32%, rgba(255, 255, 255, 0) 52%, rgba(7, 25, 57, 0.38) 100%)"

const PACK_IMAGES = [
  "/images/pack/image1.jpeg",
  "/images/pack/image3-1.jpg",
  "/images/pack/image6.jpg",
  "/images/pack/kkk.jpeg",
  "/images/pack/whatsapp-03.jpeg",
  "/images/pack/whatsapp-0.jpeg",
] as const

const STYLE_PRIMARY_PACK_IMAGE: Record<StyleKey, string> = {
  basic: "/images/pack/whatsapp-0.jpeg",
  optimum: "/images/pack/image1.jpeg",
  silver: "/images/pack/image3-1.jpg",
  gold: "/images/pack/image6.jpg",
  microcontroller: "/images/pack/kkk.jpeg",
  processor: "/images/pack/whatsapp-03.jpeg",
}

function ProgramCardHeroImageColumn({
  primarySrc,
  styleKey,
  title,
  moduleLineCount,
}: {
  primarySrc: string
  styleKey: StyleKey
  title: string
  /** Nombre de lignes « module / projet » à gauche : pilote 2 vs 3 bandeaux image. */
  moduleLineCount: number
}) {
  const stripCount: 2 | 3 = moduleLineCount >= 12 ? 3 : 2
  const [step, setStep] = useState(0)
  const [dominantSlide, setDominantSlide] = useState<{
    from: string
    to: string
    phase: "idle" | "animating"
  }>(() => ({ from: normalizeImageSrc(primarySrc), to: normalizeImageSrc(primarySrc), phase: "idle" }))
  const [dominantMotionInstant, setDominantMotionInstant] = useState(false)

  const normalizedPrimary = useMemo(() => normalizeImageSrc(primarySrc), [primarySrc])

  const pool = useMemo(() => {
    const out: string[] = []
    const push = (s: string) => {
      const v = normalizeImageSrc(s)
      if (!v) return
      if (!out.includes(v)) out.push(v)
    }
    push(normalizedPrimary)
    for (const s of PACK_IMAGES) push(s)
    return out.length > 0 ? out : ["/images/pack/image1.jpeg"]
  }, [normalizedPrimary, styleKey])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => {
      setStep((s) => {
        const max = stripCount === 3 ? HEIGHT_CYCLE_3.length : HEIGHT_CYCLE_2.length
        return (s + 1) % max
      })
    }, ROTATION_MS)
    return () => window.clearInterval(id)
  }, [stripCount])

  useEffect(() => {
    setStep(0)
  }, [stripCount, normalizedPrimary])

  useEffect(() => {
    // Quand la source principale change, on réinitialise le slide “dominant”.
    setDominantSlide({ from: normalizedPrimary, to: normalizedPrimary, phase: "idle" })
  }, [normalizedPrimary])

  const dominantIndex = useMemo(() => {
    const row = stripCount === 3 ? HEIGHT_CYCLE_3[step % HEIGHT_CYCLE_3.length] : HEIGHT_CYCLE_2[step % HEIGHT_CYCLE_2.length]
    let bestI = 0
    let bestV = -1
    for (let i = 0; i < row.length; i++) {
      const v = row[i]!
      if (v > bestV) {
        bestV = v
        bestI = i
      }
    }
    return bestI
  }, [step, stripCount])

  const visibleStripSources = useMemo(() => {
    if (pool.length === 0) return []
    const unique: string[] = []
    let cursor = (step * 2) % pool.length
    const maxIterations = pool.length * 2
    let iterations = 0
    while (unique.length < stripCount && iterations < maxIterations) {
      const candidate = pool[cursor % pool.length]!
      if (!unique.includes(candidate)) unique.push(candidate)
      cursor += 1
      iterations += 1
    }
    while (unique.length < stripCount) {
      unique.push(pool[unique.length % pool.length]!)
    }
    return unique
  }, [pool, step, stripCount])

  const stripSrcAt = (stripIndex: number) => visibleStripSources[stripIndex] ?? pool[0]!

  const dominantNextSrc = useMemo(() => {
    const forbidden = new Set(visibleStripSources)
    const currentDominant = visibleStripSources[dominantIndex]
    if (currentDominant) forbidden.delete(currentDominant)

    for (let i = 0; i < pool.length; i++) {
      const idx = (step * 3 + dominantIndex + 1 + i) % pool.length
      const candidate = pool[idx]!
      if (!forbidden.has(candidate) && candidate !== dominantSlide.to) return candidate
    }
    return currentDominant ?? pool[0]!
  }, [dominantIndex, dominantSlide.to, pool, step, visibleStripSources])

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDominantMotionInstant(true)
      setDominantSlide({ from: dominantNextSrc, to: dominantNextSrc, phase: "idle" })
      window.requestAnimationFrame(() => setDominantMotionInstant(false))
      return
    }

    if (!dominantNextSrc) return

    setDominantSlide((prev) => {
      if (prev.phase === "animating") return prev
      if (prev.to === dominantNextSrc) return prev
      return { from: prev.to, to: dominantNextSrc, phase: "animating" }
    })
  }, [dominantNextSrc])

  const endDominantSlide = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "transform") return

    let next: string | null = null
    setDominantSlide((prev) => {
      if (prev.phase !== "animating") return prev
      next = prev.to
      return prev
    })

    if (!next) return

    // Évite l’animation de retour : on coupe les transitions le temps de remettre translateY(0).
    setDominantMotionInstant(true)
    setDominantSlide({ from: next, to: next, phase: "idle" })
    window.requestAnimationFrame(() => setDominantMotionInstant(false))
  }

  const row =
    stripCount === 3 ? HEIGHT_CYCLE_3[step % HEIGHT_CYCLE_3.length] : HEIGHT_CYCLE_2[step % HEIGHT_CYCLE_2.length]

  const dominantTranslateY = dominantSlide.phase === "animating" ? "-50%" : "0%"
  const dominantTransitionClass = dominantMotionInstant
    ? "motion-reduce:transition-none transition-none"
    : "motion-reduce:transition-none transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"

  return (
    <div className="flex h-[250px] w-full min-w-0 flex-col md:h-[300px] lg:h-full lg:min-h-[300px]">
      <div
        className="flex min-h-0 w-full flex-1 flex-col gap-3 sm:gap-3.5 lg:gap-4"
        aria-label="Aperçu du pack — mise en avant rotative"
      >
        {Array.from({ length: stripCount }, (_, stripIndex) => {
          const pct = row[stripIndex]!
          const isDominant = stripIndex === dominantIndex
          const src = stripSrcAt(stripIndex)

          return (
            <div
              key={`strip-${stripCount}-${stripIndex}`}
              className="relative min-h-0 min-w-0 shrink-0 overflow-visible rounded-[1.75rem] shadow-[0_12px_40px_-12px_rgba(15,53,85,0.35)] ring-1 ring-[#1F6CA3]/12 transition-[height] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
              style={{ height: `${pct}%` }}
            >
              <div className="relative h-full overflow-hidden rounded-[1.75rem] lg:rounded-[2rem]">
                <Image
                  src={src}
                  alt={title}
                  fill
                  className="h-full w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div
                  className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] border border-white/15"
                  style={{ background: STRIP_COLOR_WASH }}
                  aria-hidden
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface ProgramCardProps {
  styleKey: string
  badgeLabel: string
  title: string
  modules: ProgramCardModule[]
  imageUrl: string
  /** Si la fonction retourne un `id` existant sur la page, le titre du module devient cliquable (scroll). */
  resolveModuleDetailId?: ProgramCardModuleTargetResolver
  primaryButtonLabel?: string
  secondaryButtonLabel?: string
  onPrimaryClick?: () => void
  onSecondaryClick?: () => void
}

export function ProgramCard({
  styleKey,
  badgeLabel,
  title,
  modules,
  imageUrl,
  resolveModuleDetailId,
  primaryButtonLabel = "S'inscrire",
  secondaryButtonLabel = "Demander le catalogue",
  onPrimaryClick,
  onSecondaryClick,
}: ProgramCardProps) {
  const sk = normalizeStyleKey(styleKey)
  const effectivePrimaryImage = STYLE_PRIMARY_PACK_IMAGE[sk]

  const isProjectModule = (m: ProgramCardModule) => {
    if (m.kind === "project") return true
    if (m.kind === "course") return false
    const lowerText = m.text.toLowerCase()
    return lowerText.includes("projet") || lowerText.includes("stage")
  }

  const typeColors: Record<StyleKey, string> = {
    basic: "text-[#1a4a7a]",
    optimum: "text-[#1e3a5f]",
    silver: "text-[#5a5a5a]",
    gold: "text-[#b8860b]",
    microcontroller: "text-[#1e3a5f]",
    processor: "text-[#1e3a5f]",
  }

  const typeBgColors: Record<StyleKey, string> = {
    basic: "bg-[#dbeafe]",
    optimum: "bg-[#e0ecf7]",
    silver: "bg-[#f0f0f0]",
    gold: "bg-[#fef5e7]",
    microcontroller: "bg-[#e0ecf7]",
    processor: "bg-[#e0ecf7]",
  }

  return (
    <div className="border-2 border-[#0A566E] rounded-3xl p-6 md:p-8 bg-white">
      <div className="mb-4">
        <div
          className={`inline-block ${typeBgColors[sk]} ${typeColors[sk]} text-xs md:text-sm font-bold uppercase tracking-widest py-2 px-3 rounded-full`}
        >
          {badgeLabel}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-balance break-words text-2xl font-bold leading-tight text-[#0C2B59] md:text-3xl">
          {title}
        </h3>
      </div>

      <div className="h-px bg-[#d4d4d4] mb-6" />

      <div className="grid grid-cols-1 items-stretch gap-6 md:gap-8 mb-8 lg:grid-cols-2">
        <ul className="space-y-3 md:space-y-4">
          {modules.map((module, index) => {
            const isProject = isProjectModule(module)
            const targetId = resolveModuleDetailId?.(module, index) ?? null
            const isNavigable = targetId != null && targetId.length > 0

            const label = (
              <>
                {isProject ? (
                  <Image
                    src="/images/medaille.png"
                    alt=""
                    width={20}
                    height={20}
                    className="mt-0.5 h-5 w-5 flex-shrink-0"
                  />
                ) : (
                  <Image
                    src="/images/verifier.png"
                    alt=""
                    width={20}
                    height={20}
                    className="mt-0.5 h-5 w-5 flex-shrink-0"
                  />
                )}

                {isNavigable ? (
                  <button
                    type="button"
                    onClick={() => scrollToElementById(targetId!)}
                    className="min-w-0 flex-1 cursor-pointer rounded border-0 bg-transparent p-0 text-left text-base font-normal leading-relaxed text-[#1a1a1a] no-underline break-words hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#335FA1] md:text-lg"
                    aria-label={`Afficher le détail du module : ${module.text}`}
                  >
                    {module.text}
                  </button>
                ) : (
                  <span className="flex-grow break-words text-base leading-relaxed text-[#1a1a1a] md:text-lg">
                    {module.text}
                  </span>
                )}
              </>
            )

            return (
              <li key={index} className="flex gap-3 items-start min-w-0">
                {label}
              </li>
            )
          })}
        </ul>

        <ProgramCardHeroImageColumn
          primarySrc={effectivePrimaryImage || imageUrl}
          styleKey={sk}
          title={title}
          moduleLineCount={modules.length}
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <RegisterButton onClick={onPrimaryClick} variant="primary">
          {primaryButtonLabel}
        </RegisterButton>
        <CatalogButton onClick={onSecondaryClick} variant="primary">
          {secondaryButtonLabel}
        </CatalogButton>
      </div>
    </div>
  )
}
