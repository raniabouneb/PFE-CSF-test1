"use client"

import Image from "next/image"

type PartnerLogo = {
  id: number
  name: string
  logo: string
}

function fillToMin(arr: PartnerLogo[], minCount: number): PartnerLogo[] {
  if (arr.length === 0) return []
  const result: PartnerLogo[] = []
  while (result.length < minCount) {
    result.push(...arr)
  }
  return result
}

export function PartnerLogosMarquee({
  partners,
  speedSeconds = 45,
}: {
  partners: PartnerLogo[]
  speedSeconds?: number
}) {
  const mid = Math.ceil(partners.length / 2)
  const firstBatch = partners.slice(0, mid)
  const secondBatch = partners.slice(mid)

  const row1 = fillToMin(firstBatch, 10)
  const row2 = fillToMin(secondBatch, 10)

  return (
    <div className="relative w-full overflow-hidden bg-[#F7FCFC] pt-6 pb-24">
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#F7FCFC] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#F7FCFC] to-transparent z-10" />

      {/* Row 1 — droite → gauche */}
      <div className="mb-4 flex overflow-hidden">
        {[0, 1].map((copy) => (
          <div
            key={`row1-copy-${copy}`}
            aria-hidden={copy === 1}
            className="csf-marquee-rtl flex items-center flex-shrink-0"
            style={{
              ["--csf-marquee-duration" as never]: `${speedSeconds}s`,
              gap: "20px",
              paddingRight: "20px",
            }}
          >
            {row1.map((partner, idx) => (
              <div
                key={`rtl-${copy}-${partner.id}-${idx}`}
                className="flex-shrink-0 h-30 w-65 flex items-center justify-center bg-white rounded-3xl"
              >
                <div className="relative h-12 w-full">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    className="object-contain object-center mix-blend-multiply"
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Row 2 — gauche → droite */}
      <div className="flex overflow-hidden">
        {[0, 1].map((copy) => (
          <div
            key={`row2-copy-${copy}`}
            aria-hidden={copy === 1}
            className="csf-marquee-ltr flex items-center flex-shrink-0"
            style={{
              ["--csf-marquee-duration" as never]: `${speedSeconds}s`,
              gap: "20px",
              paddingRight: "20px",
            }}
          >
            {row2.map((partner, idx) => (
              <div
                key={`ltr-${copy}-${partner.id}-${idx}`}
                className="flex-shrink-0 h-30 w-65 flex items-center justify-center bg-white rounded-3xl"
              >
                <div className="relative h-12 w-full">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    className="object-contain object-center mix-blend-multiply"
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <style jsx global>{`
        .csf-marquee-rtl {
          animation: csf-scroll-rtl var(--csf-marquee-duration) linear infinite;
        }
        @keyframes csf-scroll-rtl {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }

        .csf-marquee-ltr {
          animation: csf-scroll-ltr var(--csf-marquee-duration) linear infinite;
        }
        @keyframes csf-scroll-ltr {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .csf-marquee-rtl,
          .csf-marquee-ltr {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  )
}