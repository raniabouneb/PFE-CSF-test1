"use client"

import Image from "next/image"
import { partners as partnersFromLib } from "@/lib/data/partners"

export type PartnerLogo = {
  id: number
  name: string
  logo: string
}

/** Répète la liste complète des partenaires (BD) jusqu’à atteindre une longueur minimale — boucle fluide. */
function fillToMin(arr: PartnerLogo[], minCount: number): PartnerLogo[] {
  if (arr.length === 0) return []
  const result: PartnerLogo[] = []
  while (result.length < minCount) {
    result.push(...arr)
  }
  return result
}

function PartnerLogosMarquee({
  partners,
  speedSeconds,
}: {
  partners: PartnerLogo[]
  /** Durée pour parcourir une demi-piste (une copie complète des logos) ; adaptée au nombre d’items. */
  speedSeconds?: number
}) {
  if (partners.length === 0) return null

  const minTiles = Math.max(14, partners.length * 2)
  const sequence = fillToMin(partners, minTiles)
  const loopTrack = [...sequence, ...sequence]
  const duration =
    speedSeconds ?? Math.min(90, Math.max(36, Math.round((loopTrack.length / 2) * 2.2)))

  return (
    <div className="relative w-full overflow-hidden bg-[#D8EAED] pb-14 pt-2 md:pb-34 md:pt-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#D8EAED] to-transparent md:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#D8EAED] to-transparent md:w-28" />

      <div className="relative overflow-hidden">
        <div
          className="csf-marquee-partners flex w-max items-center"
          style={{
            ["--csf-marquee-duration" as never]: `${duration}s`,
            gap: "20px",
            paddingRight: "20px",
          }}
        >
          {loopTrack.map((partner, idx) => (
            <div
              key={`${partner.id}-${idx}`}
              className="partner-marquee-logo-card flex h-[7.75rem] w-[11rem] shrink-0 flex-col rounded-3xl bg-white/55 p-3 shadow-[0_4px_22px_rgba(51,95,161,0.09)] ring-1 ring-[#335FA1]/8 sm:h-[8.75rem] sm:w-[13rem] sm:p-4 md:h-[9.25rem] md:w-[14.75rem]"
            >
              {/* Zone logo identique pour chaque carte : le visuel scale avec object-contain */}
              <div className="relative min-h-0 w-full flex-1">
                <Image
                  src={partner.logo}
                  alt={idx < sequence.length ? partner.name : ""}
                  fill
                  unoptimized={/^https?:\/\//i.test(partner.logo)}
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 160px, 220px"
                  aria-hidden={idx >= sequence.length}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .csf-marquee-partners {
          animation: csf-partners-marquee var(--csf-marquee-duration) linear infinite;
        }
        @keyframes csf-partners-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .csf-marquee-partners {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  )
}

type PartenairesSectionProps = {
  /** Si tu passes une liste (ex. depuis un parent serveur), elle remplace les données du fichier lib */
  partners?: PartnerLogo[]
}

export function PartenairesSection({ partners }: PartenairesSectionProps = {}) {
  const list = partners ?? partnersFromLib

  return (
    <section
      id="partenaires"
      className="scroll-mt-24 "
      data-nav-bg="#F7FCFC"
      data-nav-tone="light"
    >
      <div className="bg-[#D8EAED] px-4 pb-8 pt-12 text-center md:pb-10 md:pt-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#299490]">
          Ils nous font confiance
        </p>
        <h2 className="mb-4 text-balance break-words text-2xl font-bold text-[#0D2A61] sm:text-3xl md:text-4xl lg:text-5xl">
          Nos partenaires
        </h2>
        <p className="mx-auto mb-5 max-w-5xl text-balance break-words text-base text-[#0A285E] md:text-xl lg:text-2xl">
          Des organisations de confiance qui partagent notre vision et nous accompagnent dans notre mission.
        </p>
      </div>

      <PartnerLogosMarquee partners={list} />
    </section>
  )
}