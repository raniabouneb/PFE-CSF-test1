"use client"

import { useState, type CSSProperties } from "react"
import Image from "next/image"
import type { Collaboration } from "@/lib/data/partners"

const MIN_CARDS = 10

type Props = {
  collaborations: Collaboration[]
  /** Secondes pour un cycle (déplacement d’un ruban complet, deux copies → voir keyframes). */
  speedSeconds?: number
}

function fillToMin(arr: Collaboration[], minCount: number): Collaboration[] {
  if (arr.length === 0) return []
  const result: Collaboration[] = []
  while (result.length < minCount) {
    result.push(...arr)
  }
  return result
}

function CollaborationCard({ item, index }: { item: Collaboration; index: number }) {
  return (
    <article className="group relative h-[min(450px,78svh)] w-[min(440px,calc(100vw-2rem))] max-w-[92vw] shrink-0 cursor-pointer overflow-hidden rounded-3xl shadow-lg transition-shadow hover:shadow-xl sm:h-[450px] sm:w-[min(440px,90vw)]">
      
      <Image
        src={item.image}
        alt=""
        fill
        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 480px) 92vw, 440px"
        priority={index < 2}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(26, 147, 163, 0.11) 0%, rgb(2, 31, 63) 100%)",
        }}
      />
      <div className="absolute bottom-4 left-2 right-2 z-[1] rounded-xl border border-white/30 bg-white/20 p-4 backdrop-blur-md">
        {item.date ? (
          <time className="mb-2 block text-xs font-medium tracking-wide text-white/60" dateTime={item.date}>
            {item.date}
          </time>
        ) : null}
        <h3 className="mb-2 text-lg font-semibold leading-snug text-white">{item.title}</h3>
        <p className="line-clamp-3 text-[16px] leading-relaxed text-white/75">
          &quot;{item.description}&quot;
        </p>
      </div>
    </article>
  )
}

export function CollaborationsMarquee({
  collaborations: items,
  speedSeconds = 40,
}: Props) {
  const [paused, setPaused] = useState(false)
  const band = fillToMin(items, MIN_CARDS)

  if (band.length === 0) {
    return null
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-white py-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-white to-transparent" />

      <div className="overflow-hidden">
        <div
          className="csf-collab-marquee flex w-max"
          style={
            {
              ["--csf-collab-duration" as string]: `${speedSeconds}s`,
              animationPlayState: paused ? "paused" : "running",
            } as CSSProperties
          }
        >
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex shrink-0 gap-6 pr-6"
              aria-hidden={copy === 1}
            >
              {band.map((item, idx) => (
                <CollaborationCard
                  key={`${copy}-${item.id}-${idx}`}
                  item={item}
                  index={idx}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .csf-collab-marquee {
          animation: csf-collab-marquee-scroll var(--csf-collab-duration, 40s) linear infinite;
        }
        @keyframes csf-collab-marquee-scroll {
          from {
            transform: translateX(0);
          }
          to {
            /* Conteneur = 2 rubans identiques : −50% = translation d’un ruban (boucle continue). */
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .csf-collab-marquee {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}
