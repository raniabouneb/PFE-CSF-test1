"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Sparkles, Target, UsersRound } from "lucide-react"
import { FormationLandingSearch } from "@/components/sections/website/formation/sections/formation-landing-search"

/** Largeurs gauche → droite (somme 100 %), cycle ~58 % / ~21 % / ~21 % comme la maquette. */
const WIDTH_CYCLE: readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]] = [
  [58, 22, 20],
  [20, 58, 22],
  [22, 20, 58],
] as const

const ROTATION_MS = 2000

/**
 * Filtre bleu/teal semi-transparent (type color wash) : visage et détails nets,
 * léger assombrissement en bas — sans voile blanc ni flou fort sur la photo.
 */
const STRIP_COLOR_WASH =
  "linear-gradient(to bottom, rgba(31, 108, 163, 0.34) 0%, rgba(43, 94, 148, 0.14) 32%, rgba(255, 255, 255, 0) 52%, rgba(7, 25, 57, 0.38) 100%)"

type BadgeItem = { label: string; Icon: LucideIcon; className: string }

type StripDef = {
  src: string
  alt: string
  badges: BadgeItem[]
}

const STRIPS: readonly StripDef[] = [
  {
    src: "/images/formation-1.jpg",
    alt: "Méthodes et parcours de formation",
    badges: [
      {
        label: "Apprentissage Certifiant",
        Icon: Target,
        className: "left-3 top-1 -translate-y-1/2 md:left-5 md:top-1",
      },
      {
        label: "Format Libre",
        Icon: Sparkles,
        className: "bottom-3 left-1/2 -translate-x-1/2 translate-y-1/2 md:bottom-1",
      },
    ],
  },
  {
    src: "/images/formation3.png",
    alt: "Formation certifiante",
    badges: [],
  },
  {
    src: "/images/formation-2.jpg",
    alt: "Conseil et formations sur mesure",
    badges: [
      {
        label: "Parcours Métier",
        Icon: UsersRound,
        className: "right-4 top-1/2 -translate-y-1/2 translate-x-[35%] md:right-5 md:translate-x-[28%]",
      },
    ],
  },
] as const

function BadgePill({ item }: { item: BadgeItem }) {
  const Icon = item.Icon
  return (
    <div
      className={`pointer-events-none absolute z-10 h-[45px] flex items-center gap-1.5 rounded-full border border-white/15 bg-white/30 px-2.5 py-1 text-[14px] font-semibold uppercase tracking-[0.12em] text-[#092642] shadow-lg backdrop-blur-sm md:gap-2 md:px-3.5 md:py-1.5 md:text-[14px] ${item.className}`}
    >
      <Icon className="size-3 shrink-0 text-[#092642] md:size-3.5" aria-hidden />
      <span className="whitespace-nowrap">{item.label}</span>
    </div>
  )
}

function FormationHeroAccordionStrips() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % WIDTH_CYCLE.length)
    }, ROTATION_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div
      className="flex h-[260px] w-full gap-3 sm:h-[300px] sm:gap-3.5 lg:h-[380px] lg:gap-4"
      aria-label="Aperçus formation — mise en avant rotative"
    >
      {STRIPS.map((strip, i) => {
        const pct = WIDTH_CYCLE[step][i]
        return (
          <div
            key={strip.src}
            className="relative min-h-0 min-w-0 shrink-0 overflow-visible rounded-[1.75rem] shadow-[0_12px_40px_-12px_rgba(15,53,85,0.35)] ring-1 ring-[#1F6CA3]/12 transition-[width] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          >
            <div className="relative h-full overflow-hidden rounded-[1.75rem] lg:rounded-[2rem]">
              <Image
                src={strip.src}
                alt={strip.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 45vw, 480px"
                priority={i === 0}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(5, 66, 74, 0.3) 0%, rgba(7, 25, 57, 0.5) 50%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] border border-white/15"
                style={{ background: STRIP_COLOR_WASH }}
                aria-hidden
              />
            </div>
            {strip.badges.map((b) => (
              <BadgePill key={b.label} item={b} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function LandingHero() {
  return (
    <section className="px-4 pb-10 pt-6 md:px-4 md:pb-8 md:pt-8 lg:px-8 lg:pb-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-12 xl:gap-x-20">
          {/* Colonne gauche : accroche, titre, description, recherche */}
          <div className="flex -ml-14 min-w-0 flex-col">
            <h1 className="mb-3 text-balance break-words font-semibold leading-[1.15] text-white/60 [font-family:var(--font-crimson)] text-[1.75rem] sm:text-[2.1rem] md:text-[2.5rem] md:leading-tight lg:text-[2.75rem]">
              Pôle Formation :{" "}
              <span className="text-[#0A566E]">apprendre, certifier, évoluer</span>
            </h1>
            <p className="mb-8 max-w-xl text-base leading-relaxed text-white/80 break-words md:text-xl">
              Accélérez votre carrière grâce à nos parcours certifiants et notre orientation pilotée par
              l&apos;IA.
            </p>
            <FormationLandingSearch variant="hero" />
          </div>

          {/* Colonne droite : trois bandeaux */}
          <div className="w-full min-w-0 lg:justify-self-end">
            <FormationHeroAccordionStrips />
          </div>
        </div>
      </div>
    </section>
  )
}