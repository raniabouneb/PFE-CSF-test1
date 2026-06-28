'use client'

import Image from "next/image"
import { useState } from "react"

interface CollaborationCard {
  id: string
  image: string | null
  title: string | null
  description: string | null
  date: string | null
}

interface CollaborationsMarqueeProps {
  collaborations: CollaborationCard[]
  speedSeconds?: number
}

function fillToMin<T>(arr: T[], minCount: number): T[] {
  if (arr.length === 0) return []
  const result: T[] = []
  while (result.length < minCount) {
    result.push(...arr)
  }
  return result
}

export function CollaborationsMarquee({ collaborations, speedSeconds = 40 }: CollaborationsMarqueeProps) {
  const [paused, setPaused] = useState(false)
  const items = fillToMin(collaborations, 10)

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />

      {/* Chaîne roulante */}
      <div className="flex overflow-hidden pb-4">
        {[0, 1].map((copy) => (
          <div
            key={`collab-copy-${copy}`}
            aria-hidden={copy === 1}
            className="csf-collab-marquee flex items-stretch flex-shrink-0"
            style={{
              ["--csf-collab-duration" as never]: `${speedSeconds}s`,
              gap: "24px",
              paddingRight: "24px",
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {items.map((collab, idx) => {
              const title = collab.title ?? "Collaborateur"
              const description = collab.description ?? "Aucune description disponible."
              const date = collab.date ?? "Date inconnue"
              const image = collab.image ?? "/placeholder-collaboration.jpg"

              return (
                <div
                  key={`${copy}-${collab.id}-${idx}`}
                  className="flex-shrink-0 w-110 h-[450px] rounded-3xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-shadow relative"
                >
                  {/* Image de fond pleine carte */}
                  <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Overlay sombre en dégradé bas */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Bloc info en bas — fond sombre semi-transparent */}
                  <div className="absolute bottom-4 left-2 right-2 bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30">
                    {/* Date */}
                    <span className="text-white/60 text-xs font-medium tracking-wide">
                      {date}
                    </span>

                    {/* Titre / Collaborateur */}
                    <h3 className="text-white font-semibold text-lg leading-snug">
                      {title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/75 text-sm leading-relaxed line-clamp-3">
                      &quot;{description}&quot;
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <style jsx global>{`
        .csf-collab-marquee {
          animation: csf-collab-scroll var(--csf-collab-duration) linear infinite;
        }
        @keyframes csf-collab-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .csf-collab-marquee {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  )
}