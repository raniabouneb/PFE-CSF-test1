"use client"

import Image from "next/image"

export type PoleHeroVariant = "conseil" | "solution"

type Props = {
  variant: PoleHeroVariant
  eyebrow: string
  titleLine: string
  highlight: string
  description: string
  /** Chemin public (ex. `/images/...`). */
  imageSrc: string
}

const HIGHLIGHT_GRADIENT: Record<PoleHeroVariant, string> = {
  conseil: "from-cyan-300 via-teal-200 to-emerald-300",
  solution: "from-sky-300 via-indigo-200 to-violet-200",
}

/** Hero moderne : image nette, dégradés, typo large, badge fil — sans ancien bloc verre central. */
export function OfferPoleHero({
  variant,
  eyebrow,
  titleLine,
  highlight,
  description,
  imageSrc,
}: Props) {
  const grad = HIGHLIGHT_GRADIENT[variant]

  return (
    <section
      data-navbar-hero
      className="relative isolate flex min-h-[min(560px,90dvh)] w-full items-stretch overflow-hidden sm:min-h-[min(620px,88dvh)]"
    >
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover object-[center_30%]"
          priority
          sizes="100vw"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950/92 via-[#0f2847]/82 to-[#1e5f8a]/45"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_20%_40%,rgba(56,189,248,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/95 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:justify-center lg:px-10 lg:pb-24 lg:pt-36">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 shadow-lg backdrop-blur-md sm:text-xs">
            {eyebrow}
          </span>

          <h1 className="mt-8 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.5rem] lg:leading-[1.08]">
            <span className="block">{titleLine}</span>
            <span
              className={`mt-1 block bg-gradient-to-r ${grad} bg-clip-text text-transparent`}
            >
              {highlight}
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg md:text-xl">
            {description}
          </p>

          <div
            className="mt-10 flex items-center gap-3"
            aria-hidden
          >
            <span className={`h-1 w-14 rounded-full bg-gradient-to-r ${grad}`} />
            <span className="text-xs font-medium uppercase tracking-widest text-white/45">
              CSF
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
